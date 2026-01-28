// app/api/projects/route.js - FIXED to use same auth system
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

// Helper function to verify JWT token - FIXED to match auth system
async function verifyAuthToken(authHeader) {
  try {
    console.log("Auth header received:", authHeader) // Debug log

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No valid authorization token provided")
    }

    const token = authHeader.substring(7)
    console.log("Extracted token:", token.substring(0, 20) + "...") // Debug log

    // Use the same verifyToken function as your auth routes
    const decoded = verifyToken(token)
    console.log("Decoded token:", decoded) // Debug log

    if (!decoded) {
      throw new Error("Token verification failed")
    }

    // The token structure might be different, let's check multiple possible fields
    const userId = decoded.userId || decoded.id || decoded.sub
    console.log("User ID from token:", userId)

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

    console.log("Found user:", user ? `${user.id} (${user.email})` : "null")

    if (!user || !user.is_active) {
      throw new Error("Invalid or inactive user")
    }

    return user
  } catch (error) {
    console.error("Token verification error:", error.message)
    throw new Error("Invalid authorization token")
  }
}

// GET /api/projects - Get user's projects
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const user = await verifyAuthToken(authHeader)

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get("page")) || 1
    const limit = parseInt(url.searchParams.get("limit")) || 10
    const search = url.searchParams.get("search") || ""

    const skip = (page - 1) * limit

    // Build where clause for search
    const whereClause = {
      owner_id: user.id,
      is_active: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    }

    // Get projects with pagination
    const [projects, totalCount] = await Promise.all([
      prisma.userProject.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { updated_at: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
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
          shares: {
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      }),
      prisma.userProject.count({ where: whereClause }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    const response = NextResponse.json({
      success: true,
      projects, // Also return projects at root level for easier access
      data: {
        projects,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    })

    return addCORSHeaders(response)
  } catch (error) {
    console.error("GET Projects Error:", error)

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

    return addCORSHeaders(handleAPIError(error, "fetch projects"))
  }
}

// POST /api/projects - Create a new project
export async function POST(request) {
  try {
    console.log("=== Creating new project ===") // Debug log

    const authHeader = request.headers.get("authorization")
    console.log(
      "Auth header:",
      authHeader ? `${authHeader.substring(0, 20)}...` : "null"
    )

    const user = await verifyAuthToken(authHeader)
    console.log("Authenticated user:", user.id, user.email)

    // Validate request body
    const validationResult = await validateRequestBody(request, {
      required: ["name"],
      fields: {
        name: "string",
        description: "string",
      },
    })

    if (validationResult instanceof NextResponse) {
      return addCORSHeaders(validationResult)
    }

    const { body } = validationResult
    const { name, description } = body

    console.log("Project data:", { name, description })

    // Validate input
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return addCORSHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Project name is required and must be a valid string",
          },
          { status: 400 }
        )
      )
    }

    if (name.trim().length > 100) {
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

    // Check if user already has a project with this name
    const existingProject = await prisma.userProject.findFirst({
      where: {
        owner_id: user.id,
        name: name.trim(),
        is_active: true,
      },
    })

    if (existingProject) {
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

    console.log("Creating project in database...")

    // Create the new project with UUID
    const newProject = await prisma.userProject.create({
      data: {
        id: uuidv4(),
        name: name.trim(),
        description: description?.trim() || null,
        owner_id: user.id,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
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

    console.log("Project created successfully:", newProject.id)

    const response = NextResponse.json({
      success: true,
      message: "Project created successfully",
      project: newProject,
    })

    return addCORSHeaders(response)
  } catch (error) {
    console.error("POST Projects Error:", error)

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

    return addCORSHeaders(handleAPIError(error, "create project"))
  }
}
