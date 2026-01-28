// app/api/auth/reset-password/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, validatePassword } from "@/lib/auth"
import {
  handleCORS,
  addCORSHeaders,
  handleAPIError,
  validateRequestBody,
} from "@/middleware/auth"

export async function OPTIONS(request) {
  return handleCORS(request)
}

export async function POST(request) {
  try {
    // Validate request body
    const validationResult = await validateRequestBody(request, {
      required: ["token", "new_password"],
      fields: {
        token: "string",
        new_password: "string",
      },
    })

    if (validationResult instanceof NextResponse) {
      return validationResult
    }

    const { body } = validationResult
    const { token, new_password } = body

    // Find valid reset token
    const resetToken = await prisma.passwordReset.findFirst({
      where: {
        token,
        used_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    })

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset token",
          error: "INVALID_TOKEN",
        },
        { status: 400 }
      )
    }

    // Validate new password strength
    const passwordValidation = validatePassword(new_password)
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

    // Hash new password
    const password_hash = await hashPassword(new_password)

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user_id },
        data: {
          password_hash,
          updated_at: new Date(),
        },
      }),
      prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: { used_at: new Date() },
      }),
      // Invalidate all user sessions
      prisma.userSession.deleteMany({
        where: { user_id: resetToken.user_id },
      }),
    ])

    const response = NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })

    return addCORSHeaders(response)
  } catch (error) {
    return addCORSHeaders(handleAPIError(error, "reset password"))
  }
}
