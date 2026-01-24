import axios from 'axios';

/**
 * Central Axios instance
 * - Works with mixed FastAPI routes
 * - Does NOT break /users/me
 * - Safe for production
 */

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

/**
 * REQUEST INTERCEPTOR
 * - Inject JWT
 * - Do NOT force trailing slash blindly
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Normalize only ROOT collection endpoints
    // e.g. /cards → /cards/
    // but leave /users/me intact
    if (config.url) {
      const [path, query] = config.url.split('?');

      const isCollection =
        !path.includes('/me') &&
        !path.match(/\/\d+$/) &&
        !path.endsWith('/');

      if (isCollection) {
        config.url = query ? `${path}/?${query}` : `${path}/`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * - Logout only on 401
 * - DO NOT auto-logout on 404
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
