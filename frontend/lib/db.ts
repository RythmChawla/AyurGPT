import { neon } from '@neondatabase/serverless'

// Create a reusable SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Helper to get a user by email
export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM user_profiles WHERE email = ${email} LIMIT 1
  `
  return result[0] || null
}

// Helper to get a user by user_id
export async function getUserById(userId: string) {
  const result = await sql`
    SELECT * FROM user_profiles WHERE user_id = ${userId} LIMIT 1
  `
  return result[0] || null
}

// Helper to create a new user
export async function createUser(data: {
  userId: string
  email: string
  name?: string
  passwordHash: string
}) {
  const result = await sql`
    INSERT INTO user_profiles (user_id, email, name, password_hash, is_admin)
    VALUES (${data.userId}, ${data.email}, ${data.name || null}, ${data.passwordHash}, false)
    RETURNING *
  `
  return result[0]
}

// Helper to check if user is admin
export async function isUserAdmin(userId: string) {
  const result = await sql`
    SELECT is_admin FROM user_profiles WHERE user_id = ${userId} LIMIT 1
  `
  return result[0]?.is_admin || false
}
