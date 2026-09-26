import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ensureCsrf, getErrorMessage } from './api'
import { unwrapData } from './unwrap'
import type { User } from '../types'

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/me')
      setUser(unwrapData<User>(data))
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        await refreshUser()
      } finally {
        setIsLoading(false)
      }
    }
    void init()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    await ensureCsrf()
    await api.post('/login', { email, password })
    await refreshUser()
  }, [refreshUser])

  const logout = useCallback(async () => {
    try {
      await ensureCsrf()
      await api.post('/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export { getErrorMessage }
