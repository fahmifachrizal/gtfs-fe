// app/api/auth/profile/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sanitizeUser, validateEmail } from "@/lib/auth"
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

export async function PUT(request) {
  try {
    const authResult = await requireAuth(request)

    if (authResult instanceof NextResponse) {
      return addCORSHeaders(authResult)
    }

    const { user } = authResult

    // Validate request body
    const validationResult = await validateRequestBody(request, {
      fields: {
        email: "string",
        username: "string",
        first_name: "string",
        last_name: "string",
        avatar_url: "string",
      },
    })

    if (validationResult instanceof NextResponse) {
      return validationResult
    }

    const { body } = validationResult
    const updateData = {}

    // Validate email if provided
    if (body.email && body.email !== user.email) {
      if (!validateEmail(body.email)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid email format",
            error: "INVALID_EMAIL",
          },
          { status: 400 }
        )
      }

      // Check if email is already taken
      const existingUser = await prisma.user.findFirst({
        where: {
          email: body.email.toLowerCase(),
          NOT: { id: user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "Email is already taken",
            error: "EMAIL_TAKEN",
          },
          { status: 409 }
        )
      }

      updateData.email = body.email.toLowerCase()
    }

    // Validate username if provided
    if (body.username && body.username !== user.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: body.username.toLowerCase(),
          NOT: { id: user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "Username is already taken",
            error: "USERNAME_TAKEN",
          },
          { status: 409 }
        )
      }

      updateData.username = body.username.toLowerCase()
    }

    // Add other fields
    if (body.first_name !== undefined) updateData.first_name = body.first_name
    if (body.last_name !== undefined) updateData.last_name = body.last_name
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      include: {
        preferences: true,
      },
    })

    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: sanitizeUser(updatedUser),
      },
    })

    return addCORSHeaders(response)
  } catch (error) {
    return addCORSHeaders(handleAPIError(error, "update user profile"))
  }
}