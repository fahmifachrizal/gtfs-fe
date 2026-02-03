import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT } from "@/config/api"

const getAgencies = async (projectId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/agencies`,
    method: "GET",
  })
}

const getAgency = async (projectId, agencyId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/agencies/${agencyId}`,
    method: "GET",
  })
}

const createAgency = async (projectId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/agencies`,
    method: "POST",
    bodyObject: data,
  })
}

const updateAgency = async (projectId, agencyId, data) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/agencies/${agencyId}`,
    method: "PUT",
    bodyObject: data,
  })
}

const deleteAgency = async (projectId, agencyId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${projectId}/agencies/${agencyId}`,
    method: "DELETE",
  })
}

export { getAgencies, getAgency, createAgency, updateAgency, deleteAgency }
