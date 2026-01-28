// app/api/auth/forgot-password/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generatePasswordResetToken, validateEmail } from "@/lib/auth"
import { passwordResetRateLimiter } from "@/lib/auth"
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
    const rateLimitResponse = rateLimit(request, passwordResetRateLimiter)
    if (rateLimitResponse) return rateLimitResponse

    // Validate request body
    const validationResult = await validateRequestBody(request, {
      required: ["email"],
      fields: {
        email: "string",
      },
    })

    if (validationResult instanceof NextResponse) {
      return validationResult
    }

    const { body } = validationResult
    const { email } = body

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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    // But only create reset token if user exists
    if (user && user.is_active) {
      // Invalidate any existing password reset tokens
      await prisma.passwordReset.updateMany({
        where: {
          user_id: user.id,
          used_at: null,
        },
        data: {
          used_at: new Date(),
        },
      })

      // Generate new reset token
      const { token, expires_at } = generatePasswordResetToken()

      await prisma.passwordReset.create({
        data: {
          user_id: user.id,
          token,
          expires_at,
        },
      })

      // TODO: Send email with reset token
      // You'll need to implement email service (e.g., SendGrid, Nodemailer)
      console.log(`Password reset token for ${email}: ${token}`)
    }

    const response = NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    })

    return addCORSHeaders(response)
  } catch (error) {
    return addCORSHeaders(handleAPIError(error, "forgot password"))
  }
}
