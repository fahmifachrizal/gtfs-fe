import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT } from "@/config/api"

const getFares = async (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/fares?${query}`,
    method: "GET",
  })
}

const createFare = async (projectId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/fares`,
    method: "POST",
    bodyObject: data,
  })
}

const updateFare = async (projectId, fareId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/fares/${fareId}`,
    method: "PUT",
    bodyObject: data,
  })
}
export { getFares, createFare, updateFare }