import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Access token en memoria — no persiste en localStorage (protege contra XSS)
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Envía cookies (adminRefreshToken) en cada request
});

// Request interceptor: agrega el access token a cada request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: si recibe 401, intenta refrescar el token una sola vez
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(error);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si no es 401 o ya es un retry, propagar el error
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // No intentar refresh en estos endpoints (evita loop infinito)
    const url = originalRequest.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar este request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Pedir nuevo access token usando la cookie del refresh token
      const { data } = await apiClient.post<{ accessToken: string }>(
        '/api/admin/auth/refresh'
      );

      setAccessToken(data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

      processQueue(null, data.accessToken);

      // Reintentar el request original con el nuevo token
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // El refresh token también expiró — limpiar todo y redirigir al login
      setAccessToken(null);
      localStorage.removeItem('adminData');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
