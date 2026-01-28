// app/api/auth/login/route.js - USES STANDARDIZED AUTH FROM lib/auth.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  verifyUserCredentials,
  generateToken,
  sanitizeUser,
  loginRateLimiter,
  getClientIP,
} from "@/lib/auth"
import {
  handleCORS,
  addCORSHeaders,
  rateLimit,
  handleAPIError,
  validateRequestBody,
} from "@/middleware/auth"

export async function OPTIONS(request) {
  return handleCORS(request)
}

export async function POST(request) {
  try {
    // Rate limiting using standardized function
    const rateLimitResponse = rateLimit(request, loginRateLimiter)
    if (rateLimitResponse) return rateLimitResponse

    // Validate request body
    const validationResult = await validateRequestBody(request, {
      required: ["email", "password"],
      fields: {
        email: "string", // Can be email or username
        password: "string",
      },
    })

    if (validationResult instanceof NextResponse) {
      return validationResult
    }

    const { body } = validationResult
    const { email, password } = body

    // STANDARDIZED: Use verifyUserCredentials from lib/auth.js
    // This function handles both email and username login
    const user = await verifyUserCredentials(email, password)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
          error: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id }, // Use user.id from verified credentials
      data: { last_login: new Date() },
    })

    // STANDARDIZED: Generate token using only user.id
    const token = generateToken(user)

    // Create session
    const session = await prisma.userSession.create({
      data: {
        user_id: user.id, // Use verified user.id
        session_token: token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ip_address: getClientIP(request),
        user_agent: request.headers.get("user-agent") || null,
      },
    })

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: sanitizeUser(user), // Remove sensitive data
        token,
        expires_at: session.expires_at,
      },
    })

    return addCORSHeaders(response)
  } catch (error) {
    console.log("Login Error:", error)
    return addCORSHeaders(handleAPIError(error, "user login"))
  }
}
