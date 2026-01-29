// hooks/useApiRequest.js - Generic API request hook
import { useState, useCallback } from "react"
import { useUser } from "@/contexts/UserContext"

/**
 * Hook for making authenticated API requests
 */
export function useApiRequest() {
  const { token, logout } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const makeRequest = useCallback(
    async (url, options = {}) => {
      setLoading(true)
      setError(null)

      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
          ...options,
        }

        const response = await fetch(url, config)
        const data = await response.json()

        if (response.status === 401) {
          // Token expired or invalid, logout user
          await logout()
          throw new Error("Authentication expired. Please login again.")
        }

        if (!response.ok) {
          throw new Error(
            data.message || `HTTP error! status: ${response.status}`
          )
        }

        return { data, response }
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [token, logout]
  )

  return { makeRequest, loading, error, setError }
}