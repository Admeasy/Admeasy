/**
 * Application Configuration
 * 
 * This file centralizes all environment variables and constants.
 * In Vite, variables must be prefixed with VITE_ to be exposed to the client.
 */

const config = {
    // API URL for requests and sockets
    apiUrl: import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin),

    // App environment
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
};

export default config;
