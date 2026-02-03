export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper to construct full URLs
export const getApiUrl = (endpoint) => {
    // Remove leading slash from endpoint if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    return `${cleanBase}${cleanEndpoint}`;
};

// API endpoint paths (not full URLs - the request utility will build full URLs)
export const API_PROJECTS_ENDPOINT = '/api/projects';