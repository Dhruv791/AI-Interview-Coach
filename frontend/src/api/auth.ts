import { apiClient } from './client'

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface RegisterPayload {
  email: string
  password: string
  full_name?: string
}

export async function registerUser(payload: RegisterPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/register', payload)
  return data
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  // Backend expects OAuth2 form data for /login
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  const { data } = await apiClient.post<TokenResponse>('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/users/me')
  return data
}

export async function updateMe(payload: { full_name?: string; avatar_url?: string }): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>('/users/me', payload)
  return data
}
