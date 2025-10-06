import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, setAccessToken } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Try to restore session from httpOnly refresh cookie first
        const refreshed = await authApi.refresh().catch(() => null)
        if (mounted && refreshed?.accessToken) {
          setToken(refreshed.accessToken)
          setAccessToken(refreshed.accessToken)
          setUser(refreshed.user)
          return
        }
        // If no refresh cookie, we're not logged in; avoid calling /me without a token
      } catch {
  // not logged in; ignore
      } finally {
        setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [])

  const auth = useMemo(() => ({
    user,
    token,
    setToken: (t) => {
      setToken(t)
      setAccessToken(t)
    },
    login: async (email, password) => {
      const { accessToken, user } = await authApi.login({ email, password })
      setToken(accessToken); setAccessToken(accessToken); setUser(user)
      return user
    },
    signup: async (name, email, password) => {
      const { accessToken, user } = await authApi.signup({ name, email, password })
      setToken(accessToken); setAccessToken(accessToken); setUser(user)
      return user
    },
    logout: async () => {
      await authApi.logout()
      setToken(null); setAccessToken(null); setUser(null)
    },
    refresh: async () => {
      try {
        const { accessToken } = await authApi.refresh()
        setToken(accessToken); setAccessToken(accessToken)
        return accessToken
      } catch (e) {
        return null
      }
    }
  }), [user, token])

  return <AuthContext.Provider value={auth}>
    {!loading && children}
  </AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
