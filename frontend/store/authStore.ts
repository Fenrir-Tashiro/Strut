import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

export type UserRole = 'walker' | 'searcher' | 'brand'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  roles: UserRole[]
  bio: string | null
  points: number
  total_earned: number
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, profile: null, isLoading: false }),
}))
