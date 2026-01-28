// app/api/gtfs/routes/[id]/route.js
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const directionId = searchParams.get("direction_id")

    if (!id) {
      return NextResponse.json(
        { message: "Route ID is required" },
        { status: 400 }
      )
    }

    const route = await prisma.route.findUnique({
      where: { route_id: id },
      include: {
        agency: true,
      },
    })

    if (!route) {
      return NextResponse.json(
        { message: `Route with ID ${id} does not exist` },
        { status: 404 }
      )
    }

    const availableDirectionsResult = await prisma.trip.findMany({
      where: { route_id: id },
      distinct: ["direction_id"],
      select: { direction_id: true },
      orderBy: { direction_id: "asc" },
    })
    const availableDirections = availableDirectionsResult.map(
      (d) => d.direction_id
    )

    const directionsToFetch =
      directionId !== null ? [parseInt(directionId)] : availableDirections
    const directionStops = {}

    for (const direction of directionsToFetch) {
      const representativeTrip = await prisma.trip.findFirst({
        where: {
          route_id: id,
          direction_id: direction,
        },
      })

      if (representativeTrip) {
        const stops = await prisma.stopTime.findMany({
          where: { trip_id: representativeTrip.trip_id },
          orderBy: { stop_sequence: "asc" },
          include: {
            stop: true, // Include the related Stop data
          },
        })

        // Map the data to your desired format
        directionStops[direction] = stops.map((st) => ({
          stop_id: st.stop.stop_id,
          stop_name: st.stop.stop_name,
          stop_desc: st.stop.stop_desc,
          stop_lat: st.stop.stop_lat,
          stop_lon: st.stop.stop_lon,
          stop_sequence: st.stop_sequence,
          arrival_time: st.arrival_time,
          departure_time: st.departure_time,
          stop_headsign: st.stop_headsign,
          pickup_type: st.pickup_type,
          drop_off_type: st.drop_off_type,
          trip_headsign: representativeTrip.trip_headsign,
          direction_id: representativeTrip.direction_id,
        }))
      } else {
        directionStops[direction] = []
      }
    }

    const transformedRoute = {
      // ... (your existing transformation logic)
      id: route.id,
      route_id: route.route_id,
      agency_id: route.agency_id,
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      agency: route.agency,
      available_directions: availableDirections,
      directions: directionStops,
      stops: directionStops[0] || directionStops[availableDirections[0]] || [],
    }

    return NextResponse.json({
      success: true,
      data: { route: transformedRoute },
    })
  } catch (error) {
    console.error("Error fetching route details:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch route details",
        message: error.message,
      },
      { status: 500 }
    )
  }
}
