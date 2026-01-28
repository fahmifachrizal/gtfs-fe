import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  try {
    // Order matters because of foreign key constraints
    await prisma.stopTime.deleteMany()
    await prisma.trip.deleteMany()
    await prisma.fareRule.deleteMany()
    await prisma.fareAttribute.deleteMany()
    await prisma.calendarDate.deleteMany()
    await prisma.calendar.deleteMany()
    await prisma.route.deleteMany()
    await prisma.stop.deleteMany()
    await prisma.agency.deleteMany()
    await prisma.shape.deleteMany()

    return NextResponse.json({
      status: "success",
      message: "All GTFS tables reset.",
    })
  } catch (err) {
    console.error("Reset Error:", err)
    return NextResponse.json(
      { error: err.message || "Error resetting GTFS tables" },
      { status: 500 }
    )
  }
}
