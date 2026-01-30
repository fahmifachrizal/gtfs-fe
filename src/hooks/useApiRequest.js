// hooks/useApiRequest.js - Generic API request hook
import { useState, useCallback } from "react"
import { useUser } from "@/contexts/UserContext"

import { getApiUrl } from "@/config/api"

/**
 * Hook for making authenticated API requests
 */
export function useApiRequest() {
  const { token, logout } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const makeRequest = useCallback(
    async (url, options = {}) => {
      const fullUrl = getApiUrl(url)
      setLoading(true)
      setError(null)

      try {
        console.log(`[ApiRequest] ${options.method || 'GET'} ${fullUrl}`, { hasToken: !!token });

        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        }

        // If body is FormData, let browser set Content-Type
        if (options.body instanceof FormData) {
          delete headers["Content-Type"]
        }

        const config = {
          headers,
          ...options,
        }

        const response = await fetch(fullUrl, config)

        let data
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.indexOf("application/json") !== -1) {
          try {
            data = await response.json()
          } catch (e) {
            // If JSON parsing fails but we have a response, maybe it's text
            const text = await response.text().catch(() => "")
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`)
          }
        } else {
          // Not JSON, read as text
          const text = await response.text()
          // If status is error, use text as message or status text
          if (!response.ok) {
            throw new Error(text || response.statusText || `HTTP error! status: ${response.status}`)
          }
          data = text // Or handle as needed, but usually we expect JSON
        }

        if (response.status === 401) {
          await logout()
          throw new Error("Authentication expired. Please login again.")
        }

        if (!response.ok) {
          throw new Error(
            data.error || data.message || `HTTP error! status: ${response.status}`
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