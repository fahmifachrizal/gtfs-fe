import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"

/**
 * Hook for components that require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, authState } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (authState === "unauthenticated") {
      navigate(redirectTo)
    }
  }, [authState, isAuthenticated, navigate, redirectTo])

  return { isAuthenticated, authState }
}

/**
 * Hook for guest-only components (login, register)
 * Redirects to dashboard if already authenticated
 */
export function useGuestOnly(redirectTo = "/editor") {
  const { isAuthenticated, authState } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && authState === "authenticated") {
      navigate(redirectTo)
    }
  }, [authState, isAuthenticated, navigate, redirectTo])

  return { isAuthenticated, authState }
}

/**
 * Hook for login form functionality
 */
export function useLogin() {
  const { login, isLoginLoading, loginError, clearErrors } = useUser()
  const navigate = useNavigate()

  const handleLogin = async (credentials, redirectTo = "/editor") => {
    const result = await login(credentials)

    if (result.success) {
      navigate(redirectTo)
    }

    return result
  }

  return {
    handleLogin,
    isLoading: isLoginLoading,
    error: loginError,
    clearErrors,
  }
}

/**
 * Hook for register form functionality
 */
export function useRegister() {
  const { register, isRegisterLoading, registerError, clearErrors } = useUser()
  const navigate = useNavigate()

  const handleRegister = async (userData, redirectTo = "/editor") => {
    const result = await register(userData)

    if (result.success) {
      navigate(redirectTo)
    }

    return result
  }

  return {
    handleRegister,
    isLoading: isRegisterLoading,
    error: registerError,
    clearErrors,
  }
}

/**
 * Hook for logout functionality
 */
export function useLogout() {
  const { logout } = useUser()
  const navigate = useNavigate()

  const handleLogout = async (redirectTo = "/") => {
    await logout()
    navigate(redirectTo)
  }

  return { handleLogout }
}

/**
 * Hook for profile management
 */
export function useProfile() {
  const {
    user,
    updateProfile,
    changePassword,
    isProfileLoading,
    isLoading,
    error,
    clearErrors,
  } = useUser()

  return {
    user,
    updateProfile,
    changePassword,
    isProfileLoading,
    isPasswordLoading: isLoading,
    error,
    clearErrors,
  }
}

/**
 * Hook for user preferences
 */
export function usePreferences() {
  const { preferences, updatePreferences, isLoading, error, clearErrors } =
    useUser()

  return {
    preferences,
    updatePreferences,
    isLoading,
    error,
    clearErrors,
  }
}

/**
 * Hook for password reset functionality
 */
export function usePasswordReset() {
  const { forgotPassword, resetPassword, isLoading, error, clearErrors } =
    useUser()

  return {
    forgotPassword,
    resetPassword,
    isLoading,
    error,
    clearErrors,
  }
}

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { user, hasPermission } = useUser()

  const checkPermission = (permission) => hasPermission(permission)

  const isAdmin = user?.role === "admin"
  const isActive = user?.is_active === true
  const isVerified = user?.is_verified === true

  return {
    checkPermission,
    isAdmin,
    isActive,
    isVerified,
    user,
  }
}

/**
 * Hook for handling authentication redirects
 */
export function useAuthRedirect() {
  const navigate = useNavigate()
  const { isAuthenticated } = useUser()

  const redirectIfAuthenticated = (path = "/editor") => {
    if (isAuthenticated) {
      navigate(path)
      return true
    }
    return false
  }

  const redirectIfNotAuthenticated = (path = "/login") => {
    if (!isAuthenticated) {
      navigate(path)
      return true
    }
    return false
  }

  return {
    redirectIfAuthenticated,
    redirectIfNotAuthenticated,
  }
}
