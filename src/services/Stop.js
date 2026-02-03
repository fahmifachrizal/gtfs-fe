import { request } from "@/utils/request";
import { API_PROJECTS_ENDPOINT } from "@/config/api";

const getStops = async (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/stops?${query}`,
    method: "GET",
  })
}

const createStop = async (projectId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/stops`,
    method: "POST",
    bodyObject: data,
  })
}

const updateStop = async (projectId, stopId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/stops/${stopId}`,
    method: "PUT",
    bodyObject: data,
  })
}

export { getStops, createStop, updateStop }
