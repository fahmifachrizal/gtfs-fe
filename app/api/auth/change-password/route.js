// app/api/auth/change-password/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, hashPassword, validatePassword } from "@/lib/auth"
import {
  handleCORS,
  addCORSHeaders,
  requireAuth,
  handleAPIError,
  validateRequestBody,
} from "@/middleware/auth"

export async function OPTIONS(request) {
  return handleCORS(request)
}

export async function POST(request) {
  try {
    const authResult = await requireAuth(request)

    if (authResult instanceof NextResponse) {
      return addCORSHeaders(authResult)
    }

    const { user } = authResult

    // Validate request body
    const validationResult = await validateRequestBody(request, {
      required: ["current_password", "new_password"],
      fields: {
        current_password: "string",
        new_password: "string",
      },
    })

    if (validationResult instanceof NextResponse) {
      return validationResult
    }

    const { body } = validationResult
    const { current_password, new_password } = body

    // Get user's current password hash
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password_hash: true },
    })

    if (!fullUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          error: "USER_NOT_FOUND",
        },
        { status: 404 }
      )
    }

    // Verify current password
    const isValidCurrentPassword = await verifyPassword(
      current_password,
      fullUser.password_hash
    )
    if (!isValidCurrentPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect",
          error: "INVALID_CURRENT_PASSWORD",
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
          message: "New password does not meet requirements",
          errors: passwordValidation.errors,
          error: "WEAK_PASSWORD",
        },
        { status: 400 }
      )
    }

    // Hash new password
    const new_password_hash = await hashPassword(new_password)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: new_password_hash,
        updated_at: new Date(),
      },
    })

    // Invalidate all existing sessions except current one
    await prisma.userSession.deleteMany({
      where: {
        user_id: user.id,
        session_token: {
          not: request.headers.get("authorization")?.slice(7), // Remove Bearer prefix
        },
      },
    })

    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })

    return addCORSHeaders(response)
  } catch (error) {
    return addCORSHeaders(handleAPIError(error, "change password"))
  }
}