// contexts/UserContext.js - Fixed User Context
"use client"
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"

// Create User Context
const UserContext = createContext()

// Custom hook to use User Context
export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

// Authentication states
export const AUTH_STATES = {
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
  ERROR: "error",
}

// User Provider Component
export function UserProvider({ children }) {
  // Core user state - FIXED: Store user with token included
  const [user, setUser] = useState(null)
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING)
  const [token, setToken] = useState(null)
  const [preferences, setPreferences] = useState(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  // Error states
  const [error, setError] = useState(null)
  const [loginError, setLoginError] = useState(null)
  const [registerError, setRegisterError] = useState(null)

  // User projects and collaboration
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [sharedProjects, setSharedProjects] = useState([])

  // Initialize auth from localStorage on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  // Auto-refresh token before expiry
  useEffect(() => {
    if (token && user) {
      const refreshInterval = setInterval(() => {
        refreshToken()
      }, 6 * 60 * 60 * 1000) // Refresh every 6 hours

      return () => clearInterval(refreshInterval)
    }
  }, [token, user])

  /**
   * FIXED: Helper function to create user object with token
   */
  const createUserWithToken = (userData, userToken) => {
    return {
      ...userData,
      token: userToken,
    }
  }

  /**
   * FIXED: Helper function to refresh user projects
   */
  const refreshProjects = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProjects(data.projects || [])
        }
      }
    } catch (error) {
      console.error("Failed to refresh projects:", error)
    }
  }

  /**
   * Initialize authentication from stored token
   */
  const initializeAuth = async () => {
    try {
      setAuthState(AUTH_STATES.LOADING)

      const storedToken = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("user_data")

      if (!storedToken) {
        setAuthState(AUTH_STATES.UNAUTHENTICATED)
        return
      }

      // Set token first
      setToken(storedToken)

      // Try to get fresh user data from API
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // FIXED: Create user with token included
          const userWithToken = createUserWithToken(data.data.user, storedToken)
          setUser(userWithToken)
          setPreferences(data.data.user.preferences)
          setProjects(data.data.user.ownedProjects || [])
          setSharedProjects(data.data.user.sharedProjects || [])

          // Update localStorage with fresh data
          localStorage.setItem("user_data", JSON.stringify(userWithToken))

          setAuthState(AUTH_STATES.AUTHENTICATED)
        } else {
          throw new Error(data.message)
        }
      } else {
        // Token might be expired, try stored user data
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          // Ensure token is included in user object
          const userWithToken = createUserWithToken(userData, storedToken)
          setUser(userWithToken)
          setAuthState(AUTH_STATES.AUTHENTICATED)

          // Refresh projects in background
          refreshProjects()
        } else {
          throw new Error("Authentication failed")
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error)
      clearAuth()
      setAuthState(AUTH_STATES.UNAUTHENTICATED)
    }
  }

  /**
   * Login user
   */
  const login = async (credentials) => {
    try {
      setIsLoginLoading(true)
      setLoginError(null)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const { user: userData, token: userToken } = data.data

        // FIXED: Create user object with token included
        const userWithToken = createUserWithToken(userData, userToken)
        setUser(userWithToken)
        setToken(userToken)
        setPreferences(userData.preferences)
        setProjects(userData.ownedProjects || [])
        setSharedProjects(userData.sharedProjects || [])

        // Store in localStorage
        localStorage.setItem("auth_token", userToken)
        localStorage.setItem("user_data", JSON.stringify(userWithToken))

        setAuthState(AUTH_STATES.AUTHENTICATED)

        // Refresh projects after login
        setTimeout(() => refreshProjects(), 100)

        return { success: true, user: userWithToken }
      } else {
        setLoginError(data.message || "Login failed")
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("Network error occurred")
      return { success: false, error: "Network error occurred" }
    } finally {
      setIsLoginLoading(false)
    }
  }

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      setIsRegisterLoading(true)
      setRegisterError(null)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const { user: newUser, token: userToken } = data.data

        // FIXED: Create user object with token included
        const userWithToken = createUserWithToken(newUser, userToken)
        setUser(userWithToken)
        setToken(userToken)
        setPreferences(newUser.preferences)
        setProjects([])
        setSharedProjects([])

        // Store in localStorage
        localStorage.setItem("auth_token", userToken)
        localStorage.setItem("user_data", JSON.stringify(userWithToken))

        setAuthState(AUTH_STATES.AUTHENTICATED)

        return { success: true, user: userWithToken }
      } else {
        setRegisterError(data.message || "Registration failed")
        return { success: false, error: data.message, errors: data.errors }
      }
    } catch (error) {
      console.error("Registration error:", error)
      setRegisterError("Network error occurred")
      return { success: false, error: "Network error occurred" }
    } finally {
      setIsRegisterLoading(false)
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      if (token) {
        // Call logout API to invalidate server sessions
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      }
    } catch (error) {
      console.error("Logout API error:", error)
    } finally {
      clearAuth()
    }
  }

  /**
   * Clear authentication data
   */
  const clearAuth = () => {
    setUser(null)
    setToken(null)
    setPreferences(null)
    setProjects([])
    setSharedProjects([])
    setCurrentProject(null)
    setError(null)
    setLoginError(null)
    setRegisterError(null)

    // Clear localStorage
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")

    setAuthState(AUTH_STATES.UNAUTHENTICATED)
  }

  /**
   * Update user profile
   */
  const updateProfile = async (profileData) => {
    try {
      setIsProfileLoading(true)
      setError(null)

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const updatedUser = data.data.user
        // FIXED: Ensure token is preserved in updated user
        const userWithToken = createUserWithToken(updatedUser, token)
        setUser(userWithToken)

        // Update localStorage
        localStorage.setItem("user_data", JSON.stringify(userWithToken))

        return { success: true, user: userWithToken }
      } else {
        setError(data.message || "Profile update failed")
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error("Profile update error:", error)
      setError("Network error occurred")
      return { success: false, error: "Network error occurred" }
    } finally {
      setIsProfileLoading(false)
    }
  }

  /**
   * Update user preferences
   */
  const updatePreferences = async (preferencesData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/preferences", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferencesData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const updatedPreferences = data.data.preferences
        setPreferences(updatedPreferences)

        // Update user data in localStorage
        const storedUser = localStorage.getItem("user_data")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          userData.preferences = updatedPreferences
          localStorage.setItem("user_data", JSON.stringify(userData))
        }

        return { success: true, preferences: updatedPreferences }
      } else {
        setError(data.message || "Preferences update failed")
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error("Preferences update error:", error)
      setError("Network error occurred")
      return { success: false, error: "Network error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Change password
   */
  const changePassword = async (passwordData) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return { success: true, message: data.message }
      } else {
        setError(data.message || "Password change failed")
        return { success: false, error: data.message, errors: data.errors }
      }
    } catch (error) {
      console.error("Password change error:", error)
      setError("Network error occurred")
      return { success: false, error: "Network error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Refresh authentication token
   */
  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const { user: userData, token: newToken } = data.data

          // FIXED: Create user with new token
          const userWithToken = createUserWithToken(userData, newToken)
          setToken(newToken)
          setUser(userWithToken)

          // Update localStorage
          localStorage.setItem("auth_token", newToken)
          localStorage.setItem("user_data", JSON.stringify(userWithToken))

          return true
        }
      }

      // If refresh fails, logout user
      clearAuth()
      return false
    } catch (error) {
      console.error("Token refresh error:", error)
      clearAuth()
      return false
    }
  }

  /**
   * Send password reset email
   */
  const forgotPassword = async (email) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return { success: true, message: data.message }
      } else {
        setError(data.message || "Password reset request failed")
        return { success: false, error: data.message }
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      setError("Network error occurred")
      return { success: false, error: "Network error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Reset password with token
   */
  const resetPassword = async (resetToken, newPassword) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: resetToken, new_password: newPassword }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return { success: true, message: data.message }
      } else {
        setError(data.message || "Password reset failed")
        return { success: false, error: data.message, errors: data.errors }
      }
    } catch (error) {
      console.error("Reset password error:", error)
      setError("Network error occurred")
      return { success: false, error: "Network error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Check if user is authenticated
   */
  const isAuthenticated =
    authState === AUTH_STATES.AUTHENTICATED && user && token

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission) => {
    if (!user) return false

    // Add your permission logic here
    // For now, just check if user is active
    return user.is_active
  }

  /**
   * Get user's full name
   */
  const getFullName = () => {
    if (!user) return ""

    const { first_name, last_name, username } = user

    if (first_name && last_name) {
      return `${first_name} ${last_name}`
    } else if (first_name) {
      return first_name
    } else if (last_name) {
      return last_name
    } else {
      return username
    }
  }

  /**
   * Get user's initials for avatar
   */
  const getInitials = () => {
    if (!user) return "??"

    const { first_name, last_name, username, email } = user

    if (first_name && last_name) {
      return `${first_name[0]}${last_name[0]}`.toUpperCase()
    } else if (first_name) {
      return first_name.slice(0, 2).toUpperCase()
    } else if (username) {
      return username.slice(0, 2).toUpperCase()
    } else {
      return email.slice(0, 2).toUpperCase()
    }
  }

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    setError(null)
    setLoginError(null)
    setRegisterError(null)
  }

  // Context value
  const contextValue = {
    // User data
    user,
    token,
    preferences,
    projects,
    sharedProjects,
    currentProject,

    // Auth state
    authState,
    isAuthenticated,

    // Loading states
    isLoading,
    isLoginLoading,
    isRegisterLoading,
    isProfileLoading,

    // Error states
    error,
    loginError,
    registerError,

    // Auth actions
    login,
    register,
    logout,
    refreshToken,

    // Profile actions
    updateProfile,
    updatePreferences,
    changePassword,

    // Password reset
    forgotPassword,
    resetPassword,

    // Project management
    setCurrentProject,
    refreshProjects, // FIXED: Expose refreshProjects function

    // Utility functions
    hasPermission,
    getFullName,
    getInitials,
    clearErrors,

    // Internal functions (for other contexts)
    initializeAuth,
    clearAuth,
  }

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  )
}
