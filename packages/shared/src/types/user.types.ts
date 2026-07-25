export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  vpa: string | null
  avatarUrl: string | null
  isOnboarded: boolean
  createdAt: string
  updatedAt:string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}