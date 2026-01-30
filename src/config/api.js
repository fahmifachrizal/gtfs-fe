// src/config/api.js
// Centralized API configuration

// Use VITE_API_URL if defined, otherwise default to http://localhost:3000
// This fallback ensures that even if .env fails, we attempt to hit the backend directly
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
console.log('[Config] API Base URL:', API_BASE_URL);

// Helper to construct full URLs
export const getApiUrl = (endpoint) => {
    // Remove leading slash from endpoint if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    return `${cleanBase}${cleanEndpoint}`;
};
