import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT } from "@/config/api"

const getAllStopTimes = async (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/stop-times?${query}`,
    method: "GET",
  })
}

const getStopTimes = async (projectId, tripId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips/${tripId}/stop-times`,
    method: "GET",
  })
}

const createStopTimes = async (projectId, tripId, stopTimes) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips/${tripId}/stop-times`,
    method: "POST",
    bodyObject: { stop_times: stopTimes },
  })
}

const autoGenerateStopTimes = async (projectId, tripId, options) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips/${tripId}/stop-times/auto-generate`,
    method: "POST",
    bodyObject: options,
  })
}

const updateStopTime = async (projectId, tripId, stopSequence, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips/${tripId}/stop-times/${stopSequence}`,
    method: "PUT",
    bodyObject: data,
  })
}

const deleteStopTimes = async (projectId, tripId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/trips/${tripId}/stop-times`,
    method: "DELETE",
  })
}

export {
  getAllStopTimes,
  getStopTimes,
  createStopTimes,
  autoGenerateStopTimes,
  updateStopTime,
  deleteStopTimes,
}
