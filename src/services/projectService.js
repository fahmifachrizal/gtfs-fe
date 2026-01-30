import { request } from "@/utils/request";

const API_BASE = '/api/projects';

export const projectService = {
    // Create a new project
    getStops: async (projectId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request({
            url: `/api/projects/${projectId}/stops?${query}`,
            method: 'GET'
        });
    },

    create: async (data) => {
        return await request({
            url: API_BASE,
            method: 'POST',
            bodyObject: data
        });
    },

    // Get all projects
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request({
            url: `${API_BASE}?${query}`,
            method: 'GET'
        });
    },

    // Get single project
    getById: async (id) => {
        return await request({
            url: `${API_BASE}/${id}`,
            method: 'GET'
        });
    },

    // Update project
    update: async (id, data) => {
        return await request({
            url: `${API_BASE}/${id}`,
            method: 'PUT',
            bodyObject: data
        });
    },

    // Delete project
    delete: async (id) => {
        return request({
            url: `/api/projects/${id}`,
            method: 'DELETE',
        });
    },

    share: async (id, email, role) => {
        return request({
            url: `/api/projects/${id}/share`,
            method: 'POST',
            bodyObject: { email, role },
        });
    },

    unshare: async (id, userId) => {
        return request({
            url: `/api/projects/${id}/share/${userId}`,
            method: 'DELETE',
        });
    },

    importGTFS: async (id, file) => {
        const formData = new FormData();
        formData.append('file', file);

        // We need to handle this manually because our request util might try to JSON.stringify body
        // and setting Content-Type to multipart/form-data manually lets browser set boundary
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/${id}/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Import failed');
        }
        return response.json();
    }
};
