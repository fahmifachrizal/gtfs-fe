import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT } from "@/config/api"

const getFrequencies = async (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/frequencies?${query}`,
    method: "GET",
  })
}

const getFrequenciesByTrip = async (projectId, tripId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips/${tripId}/frequencies`,
    method: "GET",
  })
}

const createFrequency = async (projectId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/frequencies`,
    method: "POST",
    bodyObject: data,
  })
}

const updateFrequency = async (projectId, frequencyId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/frequencies/${frequencyId}`,
    method: "PUT",
    bodyObject: data,
  })
}

const deleteFrequency = async (projectId, frequencyId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/frequencies/${frequencyId}`,
    method: "DELETE",
  })
}

const generateDefaultFrequencies = async (projectId, tripId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips/${tripId}/frequencies/generate`,
    method: "POST",
    bodyObject: {},
  })
}

export {
  getFrequencies,
  getFrequenciesByTrip,
  createFrequency,
  updateFrequency,
  deleteFrequency,
  generateDefaultFrequencies,
}
