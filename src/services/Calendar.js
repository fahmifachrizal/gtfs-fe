import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT } from "@/config/api"

const getCalendar = async (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/calendar?${query}`,
    method: "GET",
  })
}

const createCalendar = async (projectId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/calendar`,
    method: "POST",
    bodyObject: data,
  })
}

const updateCalendar = async (projectId, serviceId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/calendar/${serviceId}`,
    method: "PUT",
    bodyObject: data,
  })
}

export { getCalendar, createCalendar, updateCalendar }
