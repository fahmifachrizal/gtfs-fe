import { request } from "@/utils/request";
import { getApiUrl } from "@/config/api";

const API_BASE = '/api/projects';

export const projectService = {
    // Stops
    getStops: async (projectId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request({
            url: `/api/projects/${projectId}/stops?${query}`,
            method: 'GET'
        });
    },

    createStop: async (projectId, data) => {
        return request({
            url: `/api/projects/${projectId}/stops`,
            method: 'POST',
            bodyObject: data
        });
    },

    updateStop: async (projectId, stopId, data) => {
        return request({
            url: `/api/projects/${projectId}/stops/${stopId}`,
            method: 'PUT',
            bodyObject: data
        });
    },

    // Routes
    getRoutes: async (projectId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request({
            url: `/api/projects/${projectId}/routes?${query}`,
            method: 'GET'
        });
    },

    createRoute: async (projectId, data) => {
        return request({
            url: `/api/projects/${projectId}/routes`,
            method: 'POST',
            bodyObject: data
        });
    },

    updateRoute: async (projectId, routeId, data) => {
        return request({
            url: `/api/projects/${projectId}/routes/${routeId}`,
            method: 'PUT',
            bodyObject: data
        });
    },

    assignStopsToRoute: async (projectId, routeId, stops) => {
        return request({
            url: `/api/projects/${projectId}/routes/${routeId}/stops`,
            method: 'POST',
            bodyObject: { stops, project_id: projectId }
        });
    },

    assignStopsToRoute: async (projectId, routeId, stops, directionId) => {
        return request({
            url: `/api/projects/${projectId}/routes/${routeId}/stops`,
            method: 'POST',
            bodyObject: { stops, project_id: projectId, direction_id: directionId }
        });
    },

    getRouteStops: async (projectId, routeId) => {
        return request({
            url: `/api/projects/${projectId}/routes/${routeId}/stops`,
            method: 'GET'
        });
    },

    // Agencies
    getAgencies: async (projectId) => {
        return request({
            url: `/api/projects/${projectId}/agencies`,
            method: 'GET'
        });
    },


    // Trips
    getTrips: async (projectId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request({
            url: `/api/projects/${projectId}/trips?${query}`,
            method: 'GET'
        });
    },

    createTrip: async (projectId, data) => {
        return request({
            url: `/api/projects/${projectId}/trips`,
            method: 'POST',
            bodyObject: data
        });
    },

    updateTrip: async (projectId, tripId, data) => {
        return request({
            url: `/api/projects/${projectId}/trips/${tripId}`,
            method: 'PUT',
            bodyObject: data
        });
    },

    // Calendar
    getCalendar: async (projectId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request({
            url: `/api/projects/${projectId}/calendar?${query}`,
            method: 'GET'
        });
    },

    createCalendar: async (projectId, data) => {
        return request({
            url: `/api/projects/${projectId}/calendar`,
            method: 'POST',
            bodyObject: data
        });
    },

    updateCalendar: async (projectId, serviceId, data) => {
        return request({
            url: `/api/projects/${projectId}/calendar/${serviceId}`,
            method: 'PUT',
            bodyObject: data
        });
    },

    // Fares
    getFares: async (projectId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request({
            url: `/api/projects/${projectId}/fares?${query}`,
            method: 'GET'
        });
    },

    createFare: async (projectId, data) => {
        return request({
            url: `/api/projects/${projectId}/fares`,
            method: 'POST',
            bodyObject: data
        });
    },

    updateFare: async (projectId, fareId, data) => {
        return request({
            url: `/api/projects/${projectId}/fares/${fareId}`,
            method: 'PUT',
            bodyObject: data
        });
    },

    // Project CRUD
    create: async (data) => {
        return await request({
            url: API_BASE,
            method: 'POST',
            bodyObject: data
        });
    },

    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request({
            url: `${API_BASE}?${query}`,
            method: 'GET'
        });
    },

    getById: async (id) => {
        return await request({
            url: `${API_BASE}/${id}`,
            method: 'GET'
        });
    },

    update: async (id, data) => {
        return await request({
            url: `${API_BASE}/${id}`,
            method: 'PUT',
            bodyObject: data
        });
    },

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

        const token = localStorage.getItem('auth_token');
        const fullUrl = getApiUrl(`${API_BASE}/${id}/import`);
        const response = await fetch(fullUrl, {
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

