/**
 * General purpose request utility
 * @param {Object} params
 * @param {string} params.url - The URL to fetch
 * @param {string} [params.method='GET'] - HTTP method
 * @param {Object} [params.headersObject={}] - Custom headers
 * @param {Object} [params.bodyObject=null] - Request body
 * @returns {Promise<any>} Response data
 */
export const request = async ({ url, method = 'GET', headersObject = {}, bodyObject = null }) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...headersObject,
        },
    };

    if (bodyObject) {
        options.body = JSON.stringify(bodyObject);
    }

    // Handle absolute vs relative URLs if needed, but for now relying on proxy or cors
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
};
