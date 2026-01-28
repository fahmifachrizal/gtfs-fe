// app/api/debug/close-prisma/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$disconnect()
    return NextResponse.json({
      success: true,
      message: "All Prisma connections have been closed",
    })
  } catch (error) {
    console.error("Error closing Prisma connections:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to close connections",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
