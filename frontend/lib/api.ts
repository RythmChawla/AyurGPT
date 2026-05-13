import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { AuthTokens } from '@/types'

// Use local Next.js API routes - no external backend needed
const API_URL = ''

class APIClient {
  private client: AxiosInstance
  private token: string | null = null
  private refreshPromise: Promise<string | null> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.request.use((config) => {
      const token = this.getStoredAccessToken()
      this.token = token

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      } else {
        delete config.headers.Authorization
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as
          | (InternalAxiosRequestConfig & { _retry?: boolean })
          | undefined

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !this.isAuthEndpoint(originalRequest.url)
        ) {
          originalRequest._retry = true
          const token = await this.refreshAccessToken()

          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return this.client(originalRequest)
          }

          this.logout()
        }
        return Promise.reject(error)
      }
    )

    this.loadToken()
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  }

  private setRefreshToken(token?: string | null) {
    if (typeof window === 'undefined') return

    if (token) {
      localStorage.setItem('refresh_token', token)
    } else {
      localStorage.removeItem('refresh_token')
    }
  }

  private getStoredAccessToken() {
    if (typeof window === 'undefined') {
      return this.token
    }

    const directToken = localStorage.getItem('access_token')
    if (directToken) {
      return directToken
    }

    const persistedAuth = localStorage.getItem('auth-storage')
    if (!persistedAuth) {
      return null
    }

    try {
      const parsed = JSON.parse(persistedAuth)
      const token = parsed?.state?.tokens?.access_token
      return typeof token === 'string' ? token : null
    } catch {
      return null
    }
  }

  private loadToken() {
    const token = this.getStoredAccessToken()
    if (token) {
      this.token = token
    }
  }

  private isAuthEndpoint(url?: string) {
    return Boolean(url?.includes('/api/v1/auth/login') || url?.includes('/api/v1/auth/refresh'))
  }

  private getStoredRefreshToken() {
    if (typeof window === 'undefined') {
      return null
    }

    const directToken = localStorage.getItem('refresh_token')
    if (directToken) {
      return directToken
    }

    const persistedAuth = localStorage.getItem('auth-storage')
    if (!persistedAuth) {
      return null
    }

    try {
      const parsed = JSON.parse(persistedAuth)
      const token = parsed?.state?.tokens?.refresh_token
      return typeof token === 'string' ? token : null
    } catch {
      return null
    }
  }

  private async refreshAccessToken() {
    const refreshToken = this.getStoredRefreshToken()
    if (!refreshToken) {
      return null
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshToken(refreshToken)
        .then((tokens) => {
          this.setToken(tokens.access_token)
          this.setRefreshToken(tokens.refresh_token)
          return tokens.access_token
        })
        .catch(() => null)
        .finally(() => {
          this.refreshPromise = null
        })
    }

    return this.refreshPromise
  }

  logout() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('auth-storage')
      window.dispatchEvent(new Event('ayurgpt:logout'))
    }
  }

  // Auth endpoints
  async register(email: string, username: string, password: string) {
    const response = await this.client.post('/api/v1/auth/register', {
      email,
      username,
      password,
    })
    return response.data
  }

  async login(email: string, password: string) {
    const response = await this.client.post<AuthTokens>('/api/v1/auth/login', {
      email,
      password,
    })
    this.setToken(response.data.access_token)
    this.setRefreshToken(response.data.refresh_token)
    return response.data
  }

  async refreshToken(refreshToken: string) {
    const response = await this.client.post<AuthTokens>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    })
    this.setToken(response.data.access_token)
    this.setRefreshToken(response.data.refresh_token)
    return response.data
  }

  // Chat endpoints
  async sendMessage(content: string, chatHistoryId?: string) {
    const response = await this.client.post('/api/v1/chat/message', {
      content,
      chat_history_id: chatHistoryId,
    })
    return response.data
  }

  async getChatHistory(chatId: string) {
    const response = await this.client.get(`/api/v1/chat/history/${chatId}`)
    return response.data
  }

  async listChats(skip = 0, limit = 10) {
    const response = await this.client.get('/api/v1/chat/list', {
      params: { skip, limit },
    })
    return response.data
  }

  async deleteChat(chatId: string) {
    const response = await this.client.delete(`/api/v1/chat/${chatId}`)
    return response.data
  }

  // Dosha endpoints
  async getDoshaQuestions() {
    const response = await this.client.get('/api/v1/dosha/questions')
    return response.data
  }

  async submitDoshaAssessment(answers: Record<string, string>) {
    const response = await this.client.post('/api/v1/dosha/assess', { answers })
    return response.data
  }

  async getDoshaProfile() {
    const response = await this.client.get('/api/v1/dosha/profile')
    return response.data
  }

  // Herb endpoints
  async listHerbs(skip = 0, limit = 10, search?: string, dosha?: string) {
    const response = await this.client.get('/api/v1/herbs/', {
      params: { skip, limit, search, dosha },
    })
    return response.data
  }

  async getHerb(herbId: string) {
    const response = await this.client.get(`/api/v1/herbs/${herbId}`)
    return response.data
  }

  async favoriteHerb(herbId: string) {
    const response = await this.client.post(`/api/v1/herbs/${herbId}/favorite`)
    return response.data
  }

  async getFavoriteHerbs() {
    const response = await this.client.get('/api/v1/herbs/favorites')
    return response.data
  }

  // Symptom endpoints
  async analyzeSymptoms(symptoms: string[]) {
    const response = await this.client.post('/api/v1/symptoms/analyze', { symptoms })
    return response.data
  }

  async getSymptomSuggestions(query: string) {
    const response = await this.client.get('/api/v1/symptoms/suggestions', {
      params: { query },
    })
    return response.data
  }

  // User endpoints
  async getCurrentUser() {
    const response = await this.client.get('/api/v1/users/me')
    return response.data
  }

  async updateUserProfile(data: Record<string, unknown>) {
    const response = await this.client.put('/api/v1/users/me', data)
    return response.data
  }

  async getDashboard() {
    const response = await this.client.get('/api/v1/users/dashboard')
    return response.data
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health')
    return response.data
  }
}

export const apiClient = new APIClient()
