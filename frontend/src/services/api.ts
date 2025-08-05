import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry refresh endpoint or login endpoint
    if (originalRequest.url?.includes('/admin/refresh') || 
        originalRequest.url?.includes('/admin/login')) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await api.post('/api/admin/refresh', { refreshToken });
        localStorage.setItem('accessToken', response.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Only redirect if we're not already on the sign-in page
        if (!window.location.pathname.includes('/admin/sign-in')) {
          window.location.href = '/admin/sign-in';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Survey API
let currentSessionId: string | null = null;

export const surveyApi = {
  startSurvey: async (name: string) => {
    const response = await api.post('/api/survey/start', {
      name,
      // Use ID matching backend survey-structure.json
      surveyId: '11111111-1111-1111-1111-111111111111',
    });
    currentSessionId = response.data.sessionId;
    return response.data;
  },

  submitAnswer: async (questionId: string, answer: any) => {
    if (!currentSessionId) throw new Error('No active session');
    
    
    const response = await api.post('/api/survey/answer', {
      sessionId: currentSessionId,
      questionId,
      answer,
    });
    return response.data;
  },

  completeSurvey: async () => {
    if (!currentSessionId) throw new Error('No active session');
    const response = await api.post('/api/survey/complete', {
      sessionId: currentSessionId,
    });
    currentSessionId = null;
    return response.data;
  },

  getSurveyState: async (sessionId: string) => {
    const response = await api.get(`/api/survey/state/${sessionId}`);
    return response.data;
  },
};

// Admin API
export const adminApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/admin/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/admin/logout');
    return response.data;
  },

  getResponses: async (params: {
    page?: number;
    limit?: number;
    surveyId?: string;
    status?: string;
  }) => {
    const response = await api.get('/api/admin/responses', { params });
    return response.data;
  },

  getResponseDetail: async (responseId: string) => {
    const response = await api.get(`/api/admin/responses/${responseId}`);
    return response.data;
  },

  exportResponses: async (surveyId: string) => {
    const response = await api.get('/api/admin/export', {
      params: { surveyId, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  getAnalytics: async (surveyId: string) => {
    const response = await api.get('/api/admin/analytics/summary', {
      params: { surveyId },
    });
    return response.data;
  },
};

export default api;
