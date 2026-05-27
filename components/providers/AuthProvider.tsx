'use client'

import { createContext, useContext } from 'react'
import { useSession } from '@/lib/auth-client'

interface AuthContextValue {
  session: ReturnType<typeof useSession>['data']
  isPending: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, isPending: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  return <AuthContext.Provider value={{ session, isPending }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
