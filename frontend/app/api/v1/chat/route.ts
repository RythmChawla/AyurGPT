import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { sql } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// System prompt for AyurGPT
const SYSTEM_PROMPT = `You are AyurGPT, an educational AI assistant specializing in Ayurvedic wellness and traditional Indian medicine. 

Your role is to:
1. Provide educational information about Ayurvedic concepts, doshas (Vata, Pitta, Kapha), herbs, and lifestyle practices
2. Help users understand Ayurvedic principles and how they might apply to general wellness
3. Always be clear that you provide EDUCATIONAL information only, not medical advice
4. Recommend consulting qualified Ayurvedic practitioners or healthcare providers for personal health decisions
5. When relevant context from Ayurvedic texts is provided, use it to inform your responses and cite the sources

Important guidelines:
- Be warm, supportive, and encouraging
- Use simple language to explain complex Ayurvedic concepts
- Always include disclaimers that this is educational content, not medical advice
- If asked about serious health conditions, recommend professional consultation
- Draw from traditional Ayurvedic wisdom while being scientifically minded`

// POST /api/v1/chat - Send a message and get AI response with RAG
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
    const { message, sessionId } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Search for relevant context from RAG
    let ragContext = ''
    let sources: Array<{ title: string; content: string }> = []
    
    try {
      const queryEmbedding = generateSimpleEmbedding(message)
      
      const chunks = await sql`
        SELECT 
          dc.content,
          d.title as document_title,
          1 - (dc.embedding <=> ${queryEmbedding}::vector) as similarity
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE d.status = 'completed'
        ORDER BY dc.embedding <=> ${queryEmbedding}::vector
        LIMIT 3
      `
      
      if (chunks.length > 0) {
        // Only include chunks with decent similarity (threshold can be adjusted)
        const relevantChunks = chunks.filter(c => Number(c.similarity) > 0.1)
        
        if (relevantChunks.length > 0) {
          ragContext = '\n\nRelevant context from Ayurvedic texts:\n' + 
            relevantChunks.map((c, i) => 
              `[Source ${i + 1}: ${c.document_title}]\n${c.content}`
            ).join('\n\n')
          
          sources = relevantChunks.map(c => ({
            title: c.document_title,
            content: c.content.substring(0, 200) + '...'
          }))
        }
      }
    } catch (ragError) {
      console.error('RAG search error (continuing without context):', ragError)
    }

    // Build the prompt with RAG context
    const promptWithContext = ragContext 
      ? `${message}${ragContext}\n\nPlease use the above context to inform your response when relevant, and cite the sources.`
      : message

    // Generate response using Groq
    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: SYSTEM_PROMPT,
      prompt: promptWithContext,
      maxTokens: 1024,
    })

    // Create a custom response that includes sources in a header
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send sources as the first chunk (JSON encoded)
        if (sources.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`))
        }
        
        // Stream the text response
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`))
        }
        
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in chat API:', error)
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
