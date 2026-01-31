import { getApiUrl } from "@/config/api";
import { toast } from "sonner";

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

    const fullUrl = getApiUrl(url);
    const response = await fetch(fullUrl, options);

    if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            try {
                errorData = await response.json();
            } catch (e) {
                // Failed to parse JSON, fall back to text
            }
        }

        if (errorData && errorData.status === false && errorData.errorMessage) {
            toast.error(errorData.errorTitle || "Error", {
                description: errorData.errorMessage,
                duration: Infinity,
                className: "!bg-red-600 !text-white !border-red-700 !items-start !cursor-pointer",
                descriptionClassName: "!text-white/90 line-clamp-3",
                closeButton: true,
                onClick: () => {
                    const errorText = `${errorData.errorTitle || "Error"}\n${errorData.errorMessage}`;
                    navigator.clipboard.writeText(errorText);
                    toast.success("Error details copied to clipboard");
                }
            });
            throw new Error(errorData.errorMessage); // Throw clean message for component handling
        }

        // Fallback for non-standard errors
        const errorText = errorData ? JSON.stringify(errorData) : await response.text();
        throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
};
