import { create } from 'zustand'

export type UserRole = 'walker' | 'searcher' | 'brand'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  username: string
  roles: string // カンマ区切り
}

interface AuthState {
  user: SessionUser | null
  setUser: (user: SessionUser | null) => void
  hasRole: (role: UserRole) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  hasRole: (role) => {
    const { user } = get()
    if (!user) return false
    return user.roles.split(',').includes(role)
  },
}))
