import { create } from 'zustand'
import { getMe, UserProfile } from '../api/auth'

interface AuthState {
  user: UserProfile | null
  token: string | null
  isLoading: boolean
  // Actions
  setAuth: (token: string, user: UserProfile) => void
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: true,

  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token)
    set({ token, user, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    set({ token: null, user: null, isLoading: false })
  },

  hydrate: async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const user = await getMe()
      set({ user, token, isLoading: false })
    } catch {
      localStorage.removeItem('auth_token')
      set({ token: null, user: null, isLoading: false })
    }
  },
}))
