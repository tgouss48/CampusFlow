import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let csrfTokenCache = null;
let csrfTokenRequest = null;
let accessToken = null;
let refreshRequest = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getAccessToken() {
  return accessToken;
}

function getResolvedApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_URL || '/api';
  return new URL(configuredBaseUrl, window.location.origin);
}

function readCookie(name) {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export function getCsrfTokenFromCookie() {
  return readCookie('XSRF-TOKEN');
}

export function getCsrfToken() {
  return getCsrfTokenFromCookie() || csrfTokenCache;
}

export function buildRealtimeUrl(path, query = {}) {
  const apiBaseUrl = getResolvedApiBaseUrl();
  const protocol = apiBaseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const normalizedBasePath = apiBaseUrl.pathname.endsWith('/')
    ? apiBaseUrl.pathname.slice(0, -1)
    : apiBaseUrl.pathname;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBasePath}${normalizedPath}`, `${protocol}//${apiBaseUrl.host}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export async function ensureCsrfToken(forceRefresh = false) {
  if (!forceRefresh && (csrfTokenCache || readCookie('XSRF-TOKEN'))) {
    csrfTokenCache = readCookie('XSRF-TOKEN') || csrfTokenCache;
    return csrfTokenCache;
  }

  if (csrfTokenRequest) {
    return csrfTokenRequest;
  }

  csrfTokenRequest = api.get('/auth/csrf', { skipCsrf: true })
    .then((response) => {
      csrfTokenCache = readCookie('XSRF-TOKEN') || response.data?.token || null;
      return csrfTokenCache;
    })
    .finally(() => {
      csrfTokenRequest = null;
    });

  return csrfTokenRequest;
}

async function refreshAccessToken() {
  if (refreshRequest) {
    return refreshRequest;
  }

  refreshRequest = api.post(
    '/auth/refresh',
    {},
    { skipAuthRefresh: true }
  )
    .then((response) => {
      const nextToken = response.data?.accessToken || null;
      setAccessToken(nextToken);
      return response.data;
    })
    .catch((error) => {
      clearAccessToken();
      throw error;
    })
    .finally(() => {
      refreshRequest = null;
    });

  return refreshRequest;
}

export async function bootstrapAccessToken() {
  return refreshAccessToken();
}

api.interceptors.request.use(
  async (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = config.method?.toUpperCase();
    const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (needsCsrf && !config.skipCsrf && !config.headers['X-XSRF-TOKEN']) {
      const csrfToken = getCsrfToken() || await ensureCsrfToken();
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
      originalRequest._retry = true;

      try {
        const session = await refreshAccessToken();
        if (session?.accessToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        const path = window.location.pathname;
        const publicAuthPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
        if (!publicAuthPaths.includes(path)) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
