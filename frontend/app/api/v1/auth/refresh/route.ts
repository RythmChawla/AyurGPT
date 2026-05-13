import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { refresh_token } = body

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Verify refresh token
    const payload = verifyToken(refresh_token)

    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Get user to ensure they still exist and get latest admin status
    const users = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${payload.userId} LIMIT 1
    `
    const user = users[0]

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.user_id,
      email: user.email,
      isAdmin: user.is_admin || false,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const newRefreshToken = generateRefreshToken(tokenPayload)

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
