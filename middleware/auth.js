// middleware/auth.js - Authentication middleware (USES lib/auth.js AS REFERENCE)
import { NextResponse } from "next/server"
import { authenticateUser, checkProjectAccess, getClientIP } from "@/lib/auth"

/**
 * ========================================================================
 * AUTHENTICATION MIDDLEWARE - USES lib/auth.js FUNCTIONS
 * ========================================================================
 */

/**
 * Require authentication middleware - STANDARDIZED
 * Returns 401 if not authenticated, otherwise returns user object
 * @param {Request} request - Next.js request object
 * @returns {object|NextResponse} - User object or 401 error response
 */
export async function requireAuth(request) {
  const user = await authenticateUser(request) // Uses lib/auth.js

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED",
      },
      { status: 401 }
    )
  }

  return { user }
}

/**
 * Optional authentication middleware
 * Continues with or without user
 * @param {Request} request - Next.js request object
 * @returns {object} - Object with user or null
 */
export async function optionalAuth(request) {
  const user = await authenticateUser(request) // Uses lib/auth.js
  return { user }
}

/**
 * ========================================================================
 * AUTHORIZATION MIDDLEWARE - USES lib/auth.js FUNCTIONS
 * ========================================================================
 */

/**
 * Middleware to require project access - STANDARDIZED
 * @param {Request} request - Next.js request object
 * @param {string} projectId - Project ID
 * @param {string} minimumRole - Minimum required role
 * @returns {NextResponse|object} - Error response or access result
 */
export async function requireProjectAccess(
  request,
  projectId,
  minimumRole = "VIEWER"
) {
  // First check authentication
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult // Return auth error
  }

  const { user } = authResult

  // Then check project access using lib/auth.js function
  const accessResult = await checkProjectAccess(user.id, projectId, minimumRole)

  if (!accessResult.hasAccess) {
    return NextResponse.json(
      {
        success: false,
        message: "Access denied. Insufficient project permissions.",
        error: "FORBIDDEN",
      },
      { status: 403 }
    )
  }

  return {
    user,
    project: accessResult.project,
    role: accessResult.role,
  }
}

/**
 * ========================================================================
 * RATE LIMITING MIDDLEWARE
 * ========================================================================
 */

/**
 * Rate limiting middleware
 * @param {Request} request - Next.js request object
 * @param {object} limiter - Rate limiter instance from lib/auth.js
 * @param {string} identifier - Custom identifier (defaults to IP)
 * @returns {NextResponse|null} - Rate limit error or null if allowed
 */
export function rateLimit(request, limiter, identifier = null) {
  const id = identifier || getClientIP(request) // Uses lib/auth.js

  if (!limiter.isAllowed(id)) {
    return NextResponse.json(
      {
        success: false,
        message: "Rate limit exceeded. Please try again later.",
        error: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429 }
    )
  }

  return null
}

/**
 * ========================================================================
 * CORS MIDDLEWARE
 * ========================================================================
 */

/**
 * CORS middleware for API routes
 * @param {Request} request - Next.js request object
 * @returns {NextResponse|null} - CORS response for OPTIONS or null
 */
export function handleCORS(request) {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    })
  }

  return null
}

/**
 * Add CORS headers to response
 * @param {NextResponse} response - Response object
 * @returns {NextResponse} - Response with CORS headers
 */
export function addCORSHeaders(response) {
  response.headers.set(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_URL || "*"
  )
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  )
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  )

  return response
}

/**
 * ========================================================================
 * REQUEST VALIDATION MIDDLEWARE
 * ========================================================================
 */

/**
 * Validate request body middleware
 * @param {Request} request - Next.js request object
 * @param {object} schema - Validation schema (simple object with required fields)
 * @returns {object|NextResponse} - Parsed body or validation error
 */
export async function validateRequestBody(request, schema) {
  try {
    const body = await request.json()

    // Simple validation - check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!body[field]) {
          return NextResponse.json(
            {
              success: false,
              message: `Missing required field: ${field}`,
              error: "VALIDATION_ERROR",
            },
            { status: 400 }
          )
        }
      }
    }

    // Type validation
    if (schema.fields) {
      for (const [field, type] of Object.entries(schema.fields)) {
        if (body[field] !== undefined && typeof body[field] !== type) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid type for field ${field}. Expected ${type}.`,
              error: "VALIDATION_ERROR",
            },
            { status: 400 }
          )
        }
      }
    }

    return { body }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON in request body",
        error: "INVALID_JSON",
      },
      { status: 400 }
    )
  }
}

/**
 * ========================================================================
 * ERROR HANDLING MIDDLEWARE
 * ========================================================================
 */

/**
 * Error handler middleware
 * @param {Error} error - Error object
 * @param {string} operation - Operation being performed
 * @returns {NextResponse} - Standardized error response
 */
export function handleAPIError(error, operation = "operation") {
  console.error(`Error during ${operation}:`, error)

  // Handle known error types
  if (error.code === "P2002") {
    return NextResponse.json(
      {
        success: false,
        message: "A record with this information already exists",
        error: "DUPLICATE_ENTRY",
      },
      { status: 409 }
    )
  }

  if (error.code === "P2025") {
    return NextResponse.json(
      {
        success: false,
        message: "Record not found",
        error: "NOT_FOUND",
      },
      { status: 404 }
    )
  }

  // Generic error response
  return NextResponse.json(
    {
      success: false,
      message: "An internal server error occurred",
      error: "INTERNAL_ERROR",
    },
    { status: 500 }
  )
}
