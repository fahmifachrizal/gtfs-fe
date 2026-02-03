import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT } from "@/config/api"

const getTransfers = async (projectId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/transfers?${query}`,
    method: "GET",
  })
}

const getTransfersByStop = async (projectId, stopId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/stops/${stopId}/transfers`,
    method: "GET",
  })
}

const createTransfer = async (projectId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/transfers`,
    method: "POST",
    bodyObject: data,
  })
}

const updateTransfer = async (projectId, transferId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/transfers/${transferId}`,
    method: "PUT",
    bodyObject: data,
  })
}

const deleteTransfer = async (projectId, transferId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/transfers/${transferId}`,
    method: "DELETE",
  })
}

const generateTransfersForNearbyStops = async (projectId, options) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/transfers/generate`,
    method: "POST",
    bodyObject: options,
  })
}

export {
  getTransfers,
  getTransfersByStop,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  generateTransfersForNearbyStops,
}
