// lib/auth.js - ABSOLUTE REFERENCE POINT FOR AUTHENTICATION & AUTHORIZATION
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"

// Environment variables validation
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}

/**
 * ========================================================================
 * CORE AUTHENTICATION FUNCTIONS
 * ========================================================================
 */

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    return hash
  } catch (error) {
    throw new Error("Error hashing password")
  }
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    return false
  }
}

/**
 * ========================================================================
 * JWT TOKEN FUNCTIONS - STANDARDIZED PAYLOAD STRUCTURE
 * ========================================================================
 */

/**
 * Generate JWT token for user - USES ONLY USER ID
 * @param {object} user - User object (must have id property)
 * @returns {string} - JWT token
 */
export function generateToken(user) {
  if (!user.id) {
    throw new Error("User ID is required for token generation")
  }

  const payload = {
    userId: user.id, // STANDARDIZED: Only use userId in payload
    iat: Math.floor(Date.now() / 1000),
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verify JWT token - RETURNS ONLY USER ID
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload with userId or null if invalid
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    // Ensure payload has userId
    if (!decoded.userId) {
      return null
    }

    return {
      userId: decoded.userId,
      iat: decoded.iat,
      exp: decoded.exp,
    }
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7) // Remove 'Bearer ' prefix
}

/**
 * ========================================================================
 * USER AUTHENTICATION & VERIFICATION
 * ========================================================================
 */

/**
 * Authenticate user from request - STANDARDIZED APPROACH
 * @param {Request} request - Request object
 * @returns {object|null} - Full user object or null if not authenticated
 */
export async function authenticateUser(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      return null
    }

    // Get full user data using ONLY the userId from token
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }, // ONLY use ID from token
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_active: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
      },
    })

    // Verify user exists and is active
    if (!user || !user.is_active) {
      return null
    }

    return user
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

/**
 * Verify user credentials for login - SUPPORTS EMAIL OR USERNAME
 * @param {string} emailOrUsername - Email or username for login
 * @param {string} password - Plain text password
 * @returns {Promise<object|null>} - User object or null if invalid
 */
export async function verifyUserCredentials(emailOrUsername, password) {
  try {
    // Find user by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() },
        ],
        is_active: true, // Only active users can login
      },
      include: {
        preferences: true,
      },
    })

    if (!user) {
      return null
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return null
    }

    return user
  } catch (error) {
    console.error("Credential verification error:", error)
    return null
  }
}

/**
 * ========================================================================
 * AUTHORIZATION FUNCTIONS
 * ========================================================================
 */

/**
 * Check if user has access to a specific project
 * @param {string} userId - User ID (from authenticated token)
 * @param {string} projectId - Project ID
 * @param {string} minimumRole - Minimum required role (VIEWER, EDITOR, OWNER)
 * @returns {object} - Access result with role information
 */
export async function checkProjectAccess(
  userId,
  projectId,
  minimumRole = "VIEWER"
) {
  try {
    if (!userId || !projectId) {
      return { hasAccess: false, role: null, project: null }
    }

    // Check if user owns the project
    const ownedProject = await prisma.userProject.findFirst({
      where: {
        id: projectId,
        owner_id: userId, // Use exact userId from token
      },
    })

    if (ownedProject) {
      return {
        hasAccess: true,
        role: "OWNER",
        project: ownedProject,
      }
    }

    // Check if user has shared access
    const sharedAccess = await prisma.projectShare.findFirst({
      where: {
        project_id: projectId,
        user_id: userId, // Use exact userId from token
      },
      include: {
        project: true,
      },
    })

    if (sharedAccess) {
      const roleHierarchy = { VIEWER: 1, EDITOR: 2, OWNER: 3 }
      const userRoleLevel = roleHierarchy[sharedAccess.role] || 0
      const requiredRoleLevel = roleHierarchy[minimumRole] || 1

      if (userRoleLevel >= requiredRoleLevel) {
        return {
          hasAccess: true,
          role: sharedAccess.role,
          project: sharedAccess.project,
        }
      }
    }

    return { hasAccess: false, role: null, project: null }
  } catch (error) {
    console.error("Project access check error:", error)
    return { hasAccess: false, role: null, project: null, error: error.message }
  }
}

/**
 * ========================================================================
 * UTILITY FUNCTIONS
 * ========================================================================
 */

/**
 * Generate secure random token for password resets, invites, etc.
 * @param {number} length - Token length (default 32)
 * @returns {string} - Random token
 */
export function generateSecureToken(length = 32) {
  return randomBytes(length).toString("hex")
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 */
export function validatePassword(password) {
  const errors = []

  if (!password) {
    errors.push("Password is required")
    return { isValid: false, errors }
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push(
      "Password must contain at least one special character (@$!%*?&)"
    )
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize user data for client response (remove sensitive fields)
 * @param {object} user - User object from database
 * @returns {object} - Sanitized user object
 */
export function sanitizeUser(user) {
  const { password_hash, ...sanitizedUser } = user
  return sanitizedUser
}

/**
 * Generate password reset token with expiry
 * @returns {object} - Token and expiry date
 */
export function generatePasswordResetToken() {
  const token = generateSecureToken(32)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

  return { token, expires_at: expiresAt }
}

/**
 * Generate project invite token with expiry
 * @returns {object} - Token and expiry date
 */
export function generateInviteToken() {
  const token = generateSecureToken(32)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  return { token, expires_at: expiresAt }
}

/**
 * ========================================================================
 * RATE LIMITING
 * ========================================================================
 */

class RateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxAttempts = 5) {
    this.windowMs = windowMs
    this.maxAttempts = maxAttempts
    this.attempts = new Map()
  }

  isAllowed(identifier) {
    const now = Date.now()
    const userAttempts = this.attempts.get(identifier) || []

    // Clean old attempts outside window
    const validAttempts = userAttempts.filter(
      (time) => now - time < this.windowMs
    )

    if (validAttempts.length >= this.maxAttempts) {
      return false
    }

    // Add current attempt
    validAttempts.push(now)
    this.attempts.set(identifier, validAttempts)
    return true
  }

  reset(identifier) {
    this.attempts.delete(identifier)
  }
}

// Export rate limiter instances
export const loginRateLimiter = new RateLimiter(15 * 60 * 1000, 5) // 5 attempts per 15 minutes
export const registerRateLimiter = new RateLimiter(60 * 60 * 1000, 3) // 3 attempts per hour
export const passwordResetRateLimiter = new RateLimiter(60 * 60 * 1000, 3) // 3 attempts per hour

/**
 * ========================================================================
 * MIDDLEWARE HELPER FUNCTIONS
 * ========================================================================
 */

/**
 * Get client IP address for rate limiting
 * @param {Request} request - Request object
 * @returns {string} - Client IP address
 */
export function getClientIP(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  const real = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (real) {
    return real.trim()
  }

  return "unknown"
}
