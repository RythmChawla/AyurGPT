import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const ACCESS_TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY = '7d'

export interface JWTPayload {
  userId: string
  email: string
  isAdmin: boolean
  type: 'access' | 'refresh'
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Generate access token
export function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
}

// Generate refresh token
export function generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })
}

// Verify token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// Get current user from request headers
export async function getCurrentUser(request: Request): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  
  if (!payload || payload.type !== 'access') {
    return null
  }
  
  return payload
}

// Require authentication middleware helper
export async function requireAuth(request: Request): Promise<JWTPayload> {
  const user = await getCurrentUser(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

// Require admin middleware helper
export async function requireAdmin(request: Request): Promise<JWTPayload> {
  const user = await requireAuth(request)
  
  if (!user.isAdmin) {
    throw new Error('Forbidden')
  }
  
  return user
}
