import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET /api/v1/documents - List all documents (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const users = await sql`
      SELECT is_admin FROM user_profiles WHERE user_id = ${payload.userId}
    `
    
    if (!users[0]?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all documents with stats
    const documents = await sql`
      SELECT 
        d.*,
        COUNT(dc.id) as actual_chunk_count
      FROM documents d
      LEFT JOIN document_chunks dc ON d.id = dc.document_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/documents - Upload a new document (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const users = await sql`
      SELECT is_admin FROM user_profiles WHERE user_id = ${payload.userId}
    `
    
    if (!users[0]?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string || file?.name || 'Untitled Document'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: PDF, TXT, MD' 
      }, { status: 400 })
    }

    // Create document record with pending status
    const result = await sql`
      INSERT INTO documents (title, filename, file_size, content_type, status, uploaded_by)
      VALUES (${title}, ${file.name}, ${file.size}, ${file.type || 'text/plain'}, 'pending', ${payload.userId})
      RETURNING *
    `

    const document = result[0]

    // Read file content
    const content = await file.text()

    // Process the document in the background (for now, we'll do it inline)
    // In production, this would be a background job
    try {
      await processDocument(document.id, content)
    } catch (processError) {
      console.error('Error processing document:', processError)
      await sql`
        UPDATE documents 
        SET status = 'failed', error_message = ${String(processError)}, updated_at = NOW()
        WHERE id = ${document.id}
      `
    }

    return NextResponse.json({ 
      document,
      message: 'Document uploaded and queued for processing' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Process document: chunk and generate embeddings
async function processDocument(documentId: number, content: string) {
  // Update status to processing
  await sql`
    UPDATE documents SET status = 'processing', updated_at = NOW()
    WHERE id = ${documentId}
  `

  // Simple chunking strategy (can be improved later)
  const chunks = chunkText(content, 500, 50) // 500 chars per chunk, 50 overlap

  // For each chunk, generate embedding and store
  let chunkCount = 0
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    
    // Generate embedding using a simple approach
    // In production, use OpenAI/Cohere/HuggingFace embeddings API
    const embedding = await generateSimpleEmbedding(chunk)

    await sql`
      INSERT INTO document_chunks (document_id, chunk_index, content, embedding, metadata)
      VALUES (
        ${documentId}, 
        ${i}, 
        ${chunk}, 
        ${embedding}::vector,
        ${JSON.stringify({ char_count: chunk.length })}
      )
    `
    chunkCount++
  }

  // Update document status to completed
  await sql`
    UPDATE documents 
    SET status = 'completed', chunk_count = ${chunkCount}, updated_at = NOW()
    WHERE id = ${documentId}
  `
}

// Simple text chunking with overlap
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  
  let currentChunk = ''
  
  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      // Keep last part for overlap
      const words = currentChunk.split(' ')
      const overlapWords = words.slice(-Math.ceil(overlap / 5))
      currentChunk = overlapWords.join(' ') + ' ' + sentence
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

// Simple embedding generation (placeholder - will be replaced with real embeddings)
// This generates a deterministic 384-dimensional vector based on text content
async function generateSimpleEmbedding(text: string): Promise<string> {
  // Create a simple hash-based embedding for now
  // In production, use actual embedding models
  const embedding: number[] = new Array(384).fill(0)
  
  const words = text.toLowerCase().split(/\s+/)
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j)
      const idx = (charCode * (i + 1) * (j + 1)) % 384
      embedding[idx] += 1 / (words.length * word.length)
    }
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude
    }
  }
  
  return `[${embedding.join(',')}]`
}
