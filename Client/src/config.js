/**
 * Application Configuration
 * 
 * This file centralizes all environment variables and constants.
 * In Vite, variables must be prefixed with VITE_ to be exposed to the client.
 */

// Determine API URL - prioritize environment variable, then use same origin in production
// This function is called at runtime to ensure window.location is available
const getApiUrl = () => {
    // If VITE_API_URL is explicitly set, use it (highest priority)
    const envApiUrl = import.meta.env.VITE_API_URL;
    if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim() !== '') {
        console.log('[Config] Using VITE_API_URL:', envApiUrl);
        return envApiUrl;
    }
    
    // Check hostname at runtime - only use localhost if actually on localhost
    if (typeof window === 'undefined') {
        console.warn('[Config] window is undefined, cannot determine API URL');
        return '';
    }
    
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
    
    if (isLocalhost) {
        console.log('[Config] Detected localhost, using http://localhost:5000');
        return 'http://localhost:5000';
    }
    
    // In production (not localhost), use the same origin
    // Socket.io will automatically handle ws:// vs wss:// based on the protocol
    const origin = window.location.origin;
    console.log('[Config] Production mode, using origin:', origin, '| Hostname:', hostname);
    return origin;
};

// Create a getter function that evaluates at runtime (not at module load time)
const config = {
    // API URL for requests and sockets - evaluated at runtime
    get apiUrl() {
        return getApiUrl();
    },

    // App environment
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
};

export default config;
