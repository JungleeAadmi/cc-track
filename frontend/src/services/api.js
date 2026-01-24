import axios from 'axios';

/**
 * Central Axios instance
 * - Base URL locked to /api
 * - JWT injected automatically
 * - Trailing slash normalized (FastAPI-safe)
 * - Global 401 handling
 */

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

/**
 * REQUEST INTERCEPTOR
 * - Inject JWT
 * - Normalize trailing slash (FastAPI is strict)
 */
api.interceptors.request.use(
  (config) => {
    // Attach token if present
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Normalize URL to always end with /
    // Example: /cards  -> /cards/
    //          /users/me -> /users/me  (already correct)
    if (config.url) {
      const hasQuery = config.url.includes('?');
      const [path, query] = config.url.split('?');

      if (!path.endsWith('/')) {
        config.url = query ? `${path}/${'?' + query}` : `${path}/`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * - Auto logout on 401
 * - Clean handling for expired/invalid tokens
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or expired
      localStorage.removeItem('token');

      // Avoid redirect loop
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
