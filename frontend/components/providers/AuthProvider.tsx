'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { SessionUser } from '@/store/authStore'

function SessionSync() {
  const { data: session } = useSession()
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user as SessionUser)
    } else {
      setUser(null)
    }
  }, [session, setUser])

  return null
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync />
      {children}
    </SessionProvider>
  )
}
