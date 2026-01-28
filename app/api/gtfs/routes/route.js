// app/api/gtfs/routes/route.js - Debug Version
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const PAGE_SIZE = 10

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page")) || 1
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * PAGE_SIZE

    let whereClause = {}
    let debugMessage = "No search applied"

    if (search) {
      // Try different search approaches
      const searchLower = search.toLowerCase()

      // Method 1: Use Prisma insensitive mode
      whereClause = {
        OR: [
          { route_short_name: { contains: search, mode: "insensitive" } },
          { route_long_name: { contains: search, mode: "insensitive" } },
          { route_desc: { contains: search, mode: "insensitive" } },
          { route_id: { contains: search, mode: "insensitive" } },
        ],
      }

      // Let's also try a manual case-insensitive search for comparison
      const manualSearchResults = await prisma.route.findMany({
        where: {
          OR: [
            { route_short_name: { contains: searchLower } },
            { route_long_name: { contains: searchLower } },
            { route_desc: { contains: searchLower } },
            { route_id: { contains: searchLower } },
          ],
        },
        select: {
          route_id: true,
          route_short_name: true,
          route_long_name: true,
          route_desc: true,
        },
      })

      // Try with uppercase
      const searchUpper = search.toUpperCase()
      const upperSearchResults = await prisma.route.findMany({
        where: {
          OR: [
            { route_short_name: { contains: searchUpper } },
            { route_long_name: { contains: searchUpper } },
            { route_desc: { contains: searchUpper } },
            { route_id: { contains: searchUpper } },
          ],
        },
        select: {
          route_id: true,
          route_short_name: true,
          route_long_name: true,
          route_desc: true,
        },
      })
    }

    const [total, routes] = await prisma.$transaction([
      prisma.route.count({ where: whereClause }),
      prisma.route.findMany({
        where: whereClause,
        include: {
          agency: true,
        },
        orderBy: [{ route_sort_order: "asc" }, { route_short_name: "asc" }],
        skip: skip,
        take: PAGE_SIZE,
      }),
    ])

    // Transform the data to match expected format
    const transformedRoutes = routes.map((route) => ({
      id: route.id,
      route_id: route.route_id,
      agency_id: route.agency_id,
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      route_desc: route.route_desc,
      route_type: route.route_type,
      route_url: route.route_url,
      route_color: route.route_color,
      route_text_color: route.route_text_color,
      route_sort_order: route.route_sort_order,
      continuous_pickup: route.continuous_pickup,
      continuous_drop_off: route.continuous_drop_off,
      network_id: route.network_id,
      agency: route.agency
        ? {
            agency_id: route.agency.agency_id,
            agency_name: route.agency.agency_name,
            agency_url: route.agency.agency_url,
            agency_timezone: route.agency.agency_timezone,
            agency_lang: route.agency.agency_lang,
            agency_phone: route.agency.agency_phone,
            agency_fare_url: route.agency.agency_fare_url,
            agency_email: route.agency.agency_email,
          }
        : null,
    }))

    const meta = {
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
      totalItems: total,
      search: search,
      hasNextPage: page < Math.ceil(total / PAGE_SIZE),
      hasPreviousPage: page > 1,
      debug: {
        searchTerm: search,
        searchLength: search.length,
        debugMessage,
        whereClause: JSON.stringify(whereClause),
        resultsFound: total,
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        routes: transformedRoutes,
      },
      meta,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch routes",
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// Keep your existing POST, PUT, DELETE methods unchanged
