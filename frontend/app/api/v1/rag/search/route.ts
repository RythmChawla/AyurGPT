import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// POST /api/v1/rag/search - Search for relevant document chunks
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

    const body = await request.json()
    const { query, limit = 5 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Generate embedding for the query
    const queryEmbedding = generateSimpleEmbedding(query)

    // Search for similar chunks using cosine similarity
    const chunks = await sql`
      SELECT 
        dc.id,
        dc.content,
        dc.chunk_index,
        dc.metadata,
        d.title as document_title,
        d.filename,
        1 - (dc.embedding <=> ${queryEmbedding}::vector) as similarity
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE d.status = 'completed'
      ORDER BY dc.embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `

    return NextResponse.json({ 
      chunks: chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        chunkIndex: chunk.chunk_index,
        documentTitle: chunk.document_title,
        filename: chunk.filename,
        similarity: chunk.similarity,
        metadata: chunk.metadata
      }))
    })
  } catch (error) {
    console.error('Error searching RAG:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Simple embedding generation (must match the one used during indexing)
function generateSimpleEmbedding(text: string): string {
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
