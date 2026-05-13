import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'

export async function POST() {
  try {
    // Check if demo user already exists
    const existingUsers = await sql`
      SELECT * FROM user_profiles WHERE email = 'demo@ayurgpt.com' LIMIT 1
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({
        message: 'Demo user already exists',
        email: 'demo@ayurgpt.com',
      })
    }

    // Create demo user with known password
    const passwordHash = await hashPassword('demo123')
    const userId = crypto.randomUUID()

    await sql`
      INSERT INTO user_profiles (user_id, email, name, password_hash, is_admin)
      VALUES (${userId}, 'demo@ayurgpt.com', 'Demo User', ${passwordHash}, false)
    `

    // Create admin user
    const adminPasswordHash = await hashPassword('admin123')
    const adminUserId = crypto.randomUUID()

    const existingAdmin = await sql`
      SELECT * FROM user_profiles WHERE email = 'admin@ayurgpt.com' LIMIT 1
    `

    if (existingAdmin.length === 0) {
      await sql`
        INSERT INTO user_profiles (user_id, email, name, password_hash, is_admin)
        VALUES (${adminUserId}, 'admin@ayurgpt.com', 'Admin User', ${adminPasswordHash}, true)
      `
    }

    return NextResponse.json({
      message: 'Demo users created successfully',
      demo: { email: 'demo@ayurgpt.com', password: 'demo123' },
      admin: { email: 'admin@ayurgpt.com', password: 'admin123' },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}
