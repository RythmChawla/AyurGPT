import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, DoshaProfile, AuthTokens } from '@/types'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  hasHydrated: boolean
  error: string | null

  setUser: (user: User | null) => void
  setTokens: (tokens: AuthTokens) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setHasHydrated: (hasHydrated: boolean) => void
  setError: (error: string | null) => void
}

const clearStoredAuth = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('auth-storage')
}

const persistTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('access_token', tokens.access_token)
  if (tokens.refresh_token) {
    localStorage.setItem('refresh_token', tokens.refresh_token)
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (tokens) => {
        persistTokens(tokens)
        set({ tokens, isAuthenticated: true })
      },
      logout: () => {
        clearStoredAuth()
        set({ user: null, tokens: null, isAuthenticated: false })
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

if (typeof window !== 'undefined') {
  window.addEventListener('ayurgpt:logout', () => {
    useAuthStore.getState().logout()
  })
}

interface UserProfileState {
  doshaProfile: DoshaProfile | null
  isLoading: boolean
  error: string | null

  setDoshaProfile: (profile: DoshaProfile) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  doshaProfile: null,
  isLoading: false,
  error: null,

  setDoshaProfile: (profile) => set({ doshaProfile: profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
)
