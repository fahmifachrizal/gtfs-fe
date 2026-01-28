// app/api/projects/[id]/route.js - FIXED to use same auth system
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Use same prisma instance as auth routes
import { verifyToken } from "@/lib/auth" // Use same verifyToken as auth routes
import {
  handleCORS,
  addCORSHeaders,
  handleAPIError,
  validateRequestBody,
} from "@/middleware/auth"
import { v4 as uuidv4 } from "uuid"

export async function OPTIONS(request) {
  return handleCORS(request)
}

// Helper function to verify JWT token - CONSISTENT with other routes
async function verifyAuthToken(authHeader) {
  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No valid authorization token provided")
    }

    const token = authHeader.substring(7)

    // Use the same verifyToken function as your auth routes
    const decoded = verifyToken(token)

    if (!decoded) {
      throw new Error("Token verification failed")
    }

    // Handle different token structures
    const userId = decoded.userId || decoded.id || decoded.sub

    if (!userId) {
      throw new Error("User ID not found in token")
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        is_active: true,
        first_name: true,
        last_name: true,
      },
    })

    if (!user || !user.is_active) {
      throw new Error("Invalid or inactive user")
    }

    return user
  } catch (error) {
    console.error("Token verification error:", error.message)
    throw new Error("Invalid authorization token")
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await verifyAuthToken(authHeader)

    // Get project ID from URL params
    const projectId = params.id

    if (!projectId) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Project ID is required",
          },
          { status: 400 }
        )
      )
    }

    // Validate request body
    const validationResult = await validateRequestBody(request, {
      required: [],
      fields: {
        name: "string",
        description: "string",
        is_active: "boolean",
      },
    })

    if (validationResult instanceof NextResponse) {
      return addCORSHeaders(validationResult)
    }

    const { body } = validationResult
    const { name, description, is_active } = body

    // Validate input
    if (name && (typeof name !== "string" || name.trim().length === 0)) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Project name must be a valid string",
          },
          { status: 400 }
        )
      )
    }

    if (name && name.trim().length > 100) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Project name must be 100 characters or less",
          },
          { status: 400 }
        )
      )
    }

    if (description && description.length > 500) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Project description must be 500 characters or less",
          },
          { status: 400 }
        )
      )
    }

    // Check if project exists and user has permission
    const existingProject = await prisma.userProject.findFirst({
      where: {
        id: projectId,
        OR: [
          { owner_id: user.id },
          {
            shares: {
              some: {
                user_id: user.id,
                role: { in: ["OWNER", "EDITOR"] },
              },
            },
          },
        ],
      },
    })

    if (!existingProject) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Project not found or access denied",
          },
          { status: 404 }
        )
      )
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== existingProject.name) {
      const duplicateProject = await prisma.userProject.findFirst({
        where: {
          owner_id: user.id,
          name: name.trim(),
          is_active: true,
          id: { not: projectId },
        },
      })

      if (duplicateProject) {
        return addCORSHeaders(
          NextResponse.json(
            {
              success: false,
              error: "You already have a project with this name",
            },
            { status: 400 }
          )
        )
      }
    }

    // Build update data
    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined)
      updateData.description = description?.trim() || null
    if (is_active !== undefined) updateData.is_active = Boolean(is_active)

    // Update the project
    const updatedProject = await prisma.userProject.update({
      where: { id: projectId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        owner: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    })

    const response = NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    })

    return addCORSHeaders(response)
  } catch (error) {
    console.error("PUT Projects Error:", error)

    if (
      error.message.includes("authorization") ||
      error.message.includes("token")
    ) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Invalid authorization token",
            message: error.message,
          },
          { status: 401 }
        )
      )
    }

    return addCORSHeaders(handleAPIError(error, "update project"))
  }
}

// DELETE /api/projects/[id] - Delete a project (soft delete)
export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await verifyAuthToken(authHeader)

    // Get project ID from URL params
    const projectId = params.id

    if (!projectId) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Project ID is required",
          },
          { status: 400 }
        )
      )
    }

    // Check if project exists and user is owner
    const existingProject = await prisma.userProject.findFirst({
      where: {
        id: projectId,
        owner_id: user.id, // Only owner can delete
      },
    })

    if (!existingProject) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error:
              "Project not found or you don't have permission to delete it",
          },
          { status: 404 }
        )
      )
    }

    // Soft delete the project
    await prisma.userProject.update({
      where: { id: projectId },
      data: { is_active: false },
    })

    const response = NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    })

    return addCORSHeaders(response)
  } catch (error) {
    console.error("DELETE Projects Error:", error)

    if (
      error.message.includes("authorization") ||
      error.message.includes("token")
    ) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Invalid authorization token",
            message: error.message,
          },
          { status: 401 }
        )
      )
    }

    return addCORSHeaders(handleAPIError(error, "delete project"))
  }
}
