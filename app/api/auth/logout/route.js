// app/api/auth/logout/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  handleCORS,
  addCORSHeaders,
  requireAuth,
  handleAPIError,
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

    // Invalidate all user sessions
    await prisma.userSession.deleteMany({
      where: {
        user_id: user.id,
      },
    })

    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    })

    return addCORSHeaders(response)
  } catch (error) {
    return addCORSHeaders(handleAPIError(error, "user logout"))
  }
}