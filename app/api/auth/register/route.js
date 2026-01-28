// app/api/auth/register/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  hashPassword,
  validatePassword,
  validateEmail,
  generateToken,
  sanitizeUser,
  getClientIP,
} from "@/lib/auth"
import { registerRateLimiter } from "@/lib/auth"
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
    // Rate limiting
    const rateLimitResponse = rateLimit(request, registerRateLimiter)
    if (rateLimitResponse) return rateLimitResponse

    // Validate request body
    const validationResult = await validateRequestBody(request, {
      required: ["email", "username", "password"],
      fields: {
        email: "string",
        username: "string",
        password: "string",
        first_name: "string",
        last_name: "string",
      },
    })

    if (validationResult instanceof NextResponse) {
      return validationResult
    }

    const { body } = validationResult
    const { email, username, password, first_name, last_name } = body

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
          error: "INVALID_EMAIL",
        },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Password does not meet requirements",
          errors: passwordValidation.errors,
          error: "WEAK_PASSWORD",
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    })

    if (existingUser) {
      const field =
        existingUser.email === email.toLowerCase() ? "email" : "username"
      return NextResponse.json(
        {
          success: false,
          message: `User with this ${field} already exists`,
          error: "USER_EXISTS",
        },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password_hash,
        first_name: first_name || null,
        last_name: last_name || null,
        preferences: {
          create: {}, // Create default preferences
        },
      },
      include: {
        preferences: true,
      },
    })

    // Generate token
    const token = generateToken(user)

    // Create session
    const session = await prisma.userSession.create({
      data: {
        user_id: user.id,
        session_token: token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ip_address: getClientIP(request),
        user_agent: request.headers.get("user-agent") || null,
      },
    })

    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: {
          user: sanitizeUser(user),
          token,
          expires_at: session.expires_at,
        },
      },
      { status: 201 }
    )

    return addCORSHeaders(response)
  } catch (error) {
    return addCORSHeaders(handleAPIError(error, "user registration"))
  }
}