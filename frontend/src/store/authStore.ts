import { create } from 'zustand'
import { getMe, UserProfile } from '../api/auth'

interface AuthState {
  user: UserProfile | null
  token: string | null
  isLoading: boolean
  // Actions
  setAuth: (token: string, user: UserProfile) => void
  updateUser: (user: UserProfile) => void
  logout: () => void
  hydrate: () => Promise<void>
}

function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialToken = localStorage.getItem('auth_token')
const initialUser = getStoredUser()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: initialToken,
  // If we already have token and cached user, render optimistically (isLoading: false)
  // If token exists but no user is cached, wait for hydrate (isLoading: true)
  isLoading: Boolean(initialToken && !initialUser),

  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ token, user, isLoading: false })
  },

  updateUser: (user) => {
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    set({ token: null, user: null, isLoading: false })
  },

  hydrate: async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      localStorage.removeItem('auth_user')
      set({ token: null, user: null, isLoading: false })
      return
    }

    try {
      const user = await getMe()
      localStorage.setItem('auth_user', JSON.stringify(user))
      set({ user, token, isLoading: false })
    } catch {
      // If token is invalid or expired (401), immediately clear storage and reset state
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      set({ token: null, user: null, isLoading: false })
    }
  },
}))
