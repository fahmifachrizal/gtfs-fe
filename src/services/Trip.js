import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT } from "@/config/api"

const getTrips = async (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips?${query}`,
    method: "GET",
  })
}

const createTrip = async (projectId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips`,
    method: "POST",
    bodyObject: data,
  })
}

const updateTrip = async (projectId, tripId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips/${tripId}`,
    method: "PUT",
    bodyObject: data,
  })
}

export { getTrips, createTrip, updateTrip }
