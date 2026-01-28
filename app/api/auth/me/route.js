// app/api/auth/me/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sanitizeUser } from "@/lib/auth"
import {
  handleCORS,
  addCORSHeaders,
  requireAuth,
  handleAPIError,
} from "@/middleware/auth"

export async function OPTIONS(request) {
  return handleCORS(request)
}

export async function GET(request) {
  try {
    const authResult = await requireAuth(request)

    if (authResult instanceof NextResponse) {
      return addCORSHeaders(authResult)
    }

    const { user } = authResult

    // Get full user data with preferences and projects
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        preferences: true,
        ownedProjects: {
          select: {
            id: true,
            name: true,
            description: true,
            created_at: true,
            updated_at: true,
          },
        },
        sharedProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                created_at: true,
                updated_at: true,
              },
            },
          },
        },
      },
    })

    const response = NextResponse.json({
      success: true,
      data: {
        user: sanitizeUser(fullUser),
      },
    })

    return addCORSHeaders(response)
  } catch (error) {
    return addCORSHeaders(handleAPIError(error, "get user profile"))
  }
}