import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT } from "@/config/api"

const getRoutes = async (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/routes?${query}`,
    method: "GET",
  })
}

const createRoute = async (projectId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/routes`,
    method: "POST",
    bodyObject: data,
  })
}

const updateRoute = async (projectId, routeId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/routes/${routeId}`,
    method: "PUT",
    bodyObject: data,
  })
}

const assignStopsToRoute = async (projectId, routeId, stops) => {
  return request({
    url: `/api/projects/${projectId}/routes/${routeId}/stops`,
    method: "POST",
    bodyObject: { stops, project_id: projectId },
  })
}

const assignStopsToRouteWithDirection = async (
  projectId,
  routeId,
  stops,
  directionId,
) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/routes/${routeId}/stops`,
    method: "POST",
    bodyObject: { stops, project_id: projectId, direction_id: directionId },
  })
}

const getRouteStops = async (projectId, routeId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/routes/${routeId}/stops`,
    method: "GET",
  })
}

// Get route details with directions and stops for map display
const getRouteDetails = async (projectId, routeId) => {
  return request({
    url: `/api/gtfs/routes/${routeId}?project_id=${projectId}`,
    method: "GET",
  })
}

// Get route path (shape) and stops for a specific direction
const getRoutePathAndStops = async (projectId, routeId, directionId = 0) => {
  return request({
    url: `/api/gtfs/routes/${routeId}/path-and-stops?project_id=${projectId}&direction_id=${directionId}`,
    method: "GET",
  })
}

// Fetch all trips and return grouped by route_id -> direction_id
const getRouteGroups = async (projectId) => {
  const response = await request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips?page=1&limit=1000`,
    method: "GET",
  })

  const trips = response.trips || response.data?.trips || response.data || []

  // Group: { [route_id]: { [direction_id]: [trip, ...] } }
  const groups = {}
  trips.forEach(trip => {
    const routeId = String(trip.route_id)
    const direction = String(trip.direction_id || 0)

    if (!groups[routeId]) {
      groups[routeId] = {}
    }
    if (!groups[routeId][direction]) {
      groups[routeId][direction] = []
    }
    groups[routeId][direction].push(trip)
  })

  return { success: true, data: groups }
}

export {
  getRoutes,
  createRoute,
  updateRoute,
  assignStopsToRoute,
  assignStopsToRouteWithDirection,
  getRouteStops,
  getRouteDetails,
  getRoutePathAndStops,
  getRouteGroups,
}
