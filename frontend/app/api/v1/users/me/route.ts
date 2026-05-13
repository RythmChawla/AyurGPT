import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const authUser = await getCurrentUser(request)

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const users = await sql`
      SELECT user_id, email, name, is_admin, created_at, updated_at 
      FROM user_profiles 
      WHERE user_id = ${authUser.userId} 
      LIMIT 1
    `
    const user = users[0]

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data in expected format
    return NextResponse.json({
      id: user.user_id,
      email: user.email,
      username: user.name || user.email.split('@')[0],
      full_name: user.name,
      is_active: true,
      is_verified: true,
      is_admin: user.is_admin || false,
      created_at: user.created_at,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const authUser = await getCurrentUser(request)

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { full_name, username } = body

    // Update user
    const users = await sql`
      UPDATE user_profiles 
      SET name = ${full_name || username}, updated_at = NOW()
      WHERE user_id = ${authUser.userId}
      RETURNING user_id, email, name, is_admin, created_at, updated_at
    `
    const user = users[0]

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.user_id,
      email: user.email,
      username: user.name || user.email.split('@')[0],
      full_name: user.name,
      is_active: true,
      is_verified: true,
      is_admin: user.is_admin || false,
      created_at: user.created_at,
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
