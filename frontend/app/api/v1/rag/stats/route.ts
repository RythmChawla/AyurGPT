import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET /api/v1/rag/stats - Get RAG system statistics
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

    // Get document stats
    const docStats = await sql`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_documents,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_documents,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_documents
      FROM documents
    `

    // Get chunk stats
    const chunkStats = await sql`
      SELECT COUNT(*) as total_chunks
      FROM document_chunks
    `

    // Check if RAG is ready (has at least some processed content)
    const isReady = Number(docStats[0]?.completed_documents) > 0 && Number(chunkStats[0]?.total_chunks) > 0

    return NextResponse.json({
      isReady,
      documents: {
        total: Number(docStats[0]?.total_documents) || 0,
        completed: Number(docStats[0]?.completed_documents) || 0,
        processing: Number(docStats[0]?.processing_documents) || 0,
        failed: Number(docStats[0]?.failed_documents) || 0
      },
      chunks: {
        total: Number(chunkStats[0]?.total_chunks) || 0
      }
    })
  } catch (error) {
    console.error('Error getting RAG stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
