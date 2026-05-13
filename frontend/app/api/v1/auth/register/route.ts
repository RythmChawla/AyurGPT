import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { hashPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT * FROM user_profiles WHERE email = ${email} LIMIT 1
    `

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate unique user ID
    const userId = crypto.randomUUID()

    // Create user
    const newUsers = await sql`
      INSERT INTO user_profiles (user_id, email, name, password_hash, is_admin)
      VALUES (${userId}, ${email}, ${username || email.split('@')[0]}, ${passwordHash}, false)
      RETURNING *
    `
    const user = newUsers[0]

    // Generate tokens
    const tokenPayload = {
      userId: user.user_id,
      email: user.email,
      isAdmin: false,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
