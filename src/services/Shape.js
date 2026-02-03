import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT } from "@/config/api"

const getShapes = async (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/shapes?${query}`,
    method: "GET",
  })
}

const getShape = async (projectId, shapeId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/shapes/${shapeId}`,
    method: "GET",
  })
}

const createOrUpdateShape = async (projectId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/shapes`,
    method: "POST",
    bodyObject: data,
  })
}

const saveShape = async (projectId, data) => {
  return createOrUpdateShape(projectId, data)
}

const deleteShape = async (projectId, shapeId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/shapes/${shapeId}`,
    method: "DELETE",
  })
}

const generateShapeFromRoute = async (projectId, routeId, directionId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/routes/${routeId}/generate-shape`,
    method: "POST",
    bodyObject: { direction_id: directionId },
  })
}

export {
  getShapes,
  getShape,
  createOrUpdateShape,
  saveShape,
  deleteShape,
  generateShapeFromRoute,
}