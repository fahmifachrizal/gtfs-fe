import { request } from "@/utils/request"
import { API_PROJECTS_ENDPOINT, getApiUrl } from "@/config/api"

const create = async (data) => {
  return await request({
    url: API_PROJECTS_ENDPOINT,
    method: "POST",
    bodyObject: data,
  })
}

const getAll = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request({
    url: `${API_PROJECTS_ENDPOINT}?${query}`,
    method: "GET",
  })
}

const getById = async (id) => {
  return await request({
    url: `${API_PROJECTS_ENDPOINT}/${id}`,
    method: "GET",
  })
}

const update = async (id, data) => {
  return await request({
    url: `${API_PROJECTS_ENDPOINT}/${id}`,
    method: "PUT",
    bodyObject: data,
  })
}

const deleteById = async (id) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${id}`,
    method: "DELETE",
  })
}

const share = async (id, email, role) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${id}/share`,
    method: "POST",
    bodyObject: { email, role },
  })
}

const unshare = async (id, userId) => {
  return request({
    url: `${API_PROJECTS_ENDPOINT}/${id}/share/${userId}`,
    method: "DELETE",
  })
}

const importGTFS = async (id, file) => {
  const formData = new FormData()
  formData.append("file", file)

  const token = localStorage.getItem("auth_token")
  const fullUrl = getApiUrl(`${API_PROJECTS_ENDPOINT}/${id}/import`)
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Import failed")
  }
  return response.json()
}

export {
  create,
  getAll,
  getById,
  update,
  deleteById,
  share,
  unshare,
  importGTFS,
}