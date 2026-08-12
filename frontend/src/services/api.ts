import axios from 'axios';
import type {
  ApiResponse, AuthResponse, LoginCredentials, RegisterData,
  PredictionRequest, PredictionResult, PredictionLog, PaginatedResponse,
  Statistics, HourlyTrend, BlockedIP, Alert, ExplanationResult,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor: attach JWT token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor: auto-refresh on 401 ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, {
          refreshToken,
        });
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const authApi = {
  register: (data: RegisterData) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  login: (data: LoginCredentials) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get<ApiResponse<AuthResponse['user']>>('/auth/profile'),
};

// ── Predictions ──
export const predictionApi = {
  predict: (data: PredictionRequest) =>
    api.post<ApiResponse<PredictionResult>>('/predictions', data),

  getLogs: (params?: { page?: number; limit?: number; prediction?: string }) =>
    api.get<ApiResponse<PaginatedResponse<PredictionLog>>>('/predictions/logs', { params }),

  getStatistics: () =>
    api.get<ApiResponse<Statistics>>('/predictions/statistics'),

  getHourlyTrend: (hours = 24) =>
    api.get<ApiResponse<HourlyTrend[]>>('/predictions/trend', { params: { hours } }),

  clearLogs: () => api.delete('/predictions/logs'),

  explain: (data: { data: Record<string, number>; preNormalized?: boolean }) =>
    api.post<ApiResponse<ExplanationResult>>('/predictions/explain', data),

  batchAnalysis: (file: File, modelType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modelType', modelType);
    return api.post('/predictions/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },
};

// ── Blocked IPs ──
export const blockedIPApi = {
  getAll: (active?: boolean) =>
    api.get<ApiResponse<{ blockedIPs: BlockedIP[]; total: number }>>('/blocked-ips', {
      params: active !== undefined ? { active } : {},
    }),
  block: (data: { ipAddress: string; reason: string; attackType: string }) =>
    api.post('/blocked-ips', data),
  unblock: (ip: string) => api.delete(`/blocked-ips/${ip}`),
};

// ── Alerts ──
export const alertApi = {
  getAll: (params?: { page?: number; type?: string; isRead?: boolean }) =>
    api.get<ApiResponse<{ alerts: Alert[]; unreadCount: number }>>('/alerts', { params }),
  markAsRead: (id: string) => api.patch(`/alerts/${id}/read`),
  markAllAsRead: () => api.patch('/alerts/read-all'),
};

// ── Health ──
export const healthApi = {
  check: () => api.get('/health'),
};

export default api;
