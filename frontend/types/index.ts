/* Global types */
export interface User {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  is_active: boolean
  is_verified: boolean
  is_admin?: boolean
  created_at: string
}

export interface DoshaProfile {
  vata_score: number
  pitta_score: number
  kapha_score: number
  primary_dosha: 'Vata' | 'Pitta' | 'Kapha'
  secondary_dosha?: string
  dosha_description: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, any>
  created_at: string
}

export interface ChatHistory {
  id: string
  title?: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export interface Source {
  id: string
  book_name: string
  chapter_name?: string
  verse_number?: string
  content: string
}

export interface Herb {
  id: string
  name: string
  sanskrit_name?: string
  english_name?: string
  description?: string
  properties?: Record<string, any>
  dosha_effects?: Record<string, any>
  uses?: string
  contraindications?: string
  preparation_methods?: string[]
  safety_warnings?: string
  image_url?: string
}

export interface SymptomAnalysis {
  symptoms: string[]
  possible_dosha_involvement: Record<string, number>
  explanation: string
  recommendations: string[]
  disclaimer: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}
