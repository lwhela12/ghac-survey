import axios from 'axios';
import { getFirstTouch, parseFromPage } from '../utils/tracking';

// Use VITE_API_URL if defined (including empty string), otherwise use localhost for dev
const API_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:4001';

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

// Session persistence helpers
const SESSION_STORAGE_KEY = 'ghac_survey_session';
const SESSION_EXPIRY_KEY = 'ghac_survey_expiry';

const saveSession = (sessionId: string) => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hour expiry
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toISOString());
};

const getStoredSession = (): string | null => {
  const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  
  if (!sessionId || !expiry) return null;
  
  // Check if session has expired
  if (new Date(expiry) < new Date()) {
    clearStoredSession();
    return null;
  }
  
  return sessionId;
};

const clearStoredSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
};

export const surveyApi = {
  startSurvey: async (name: string) => {
    try {
      const tracking = getFirstTouch() || parseFromPage();
      const response = await api.post('/api/survey/start', {
        name,
        surveyId: '11111111-1111-1111-1111-111111111111',
        tracking,
      });
      currentSessionId = response.data.sessionId;
      saveSession(response.data.sessionId);
      return response.data;
    } catch (err) {
      let errorMessage = 'An unknown error occurred during survey start.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
        console.error('Survey start Axios error:', {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data
        });
      } else if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Survey start generic error:', err);
      } else {
        console.error('Survey start unknown error:', err);
      }
      throw new Error(errorMessage);
    }
  },
  
  checkExistingSession: async (): Promise<{ exists: boolean; sessionId?: string; state?: any }> => {
    const storedSessionId = getStoredSession();
    if (!storedSessionId) return { exists: false };
    
    try {
      const response = await api.get(`/api/survey/state/${storedSessionId}`);
      currentSessionId = storedSessionId;
      return {
        exists: true,
        sessionId: storedSessionId,
        state: response.data
      };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        console.log('Session not found on server, clearing local session.');
      } else {
        console.error('Error checking existing session:', err);
      }
      clearStoredSession();
      return { exists: false };
    }
  },
  
  resumeSurvey: async (sessionId: string) => {
    try {
      currentSessionId = sessionId;
      const response = await api.get(`/api/survey/state/${sessionId}`);
      return response.data;
    } catch (err) {
      let errorMessage = 'An unknown error occurred while resuming survey.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      }
      throw new Error(errorMessage);
    }
  },

  submitAnswer: async (questionId: string, answer: any) => {
    if (!currentSessionId) throw new Error('No active session');
    try {
      const response = await api.post('/api/survey/answer', {
        sessionId: currentSessionId,
        questionId,
        answer,
      });
      return response.data;
    } catch (err) {
      let errorMessage = 'An unknown error occurred while submitting answer.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      }
      throw new Error(errorMessage);
    }
  },

  completeSurvey: async () => {
    if (!currentSessionId) throw new Error('No active session');
    try {
      const response = await api.post('/api/survey/complete', {
        sessionId: currentSessionId,
      });
      currentSessionId = null;
      clearStoredSession();
      return response.data;
    } catch (err) {
      let errorMessage = 'An unknown error occurred while completing survey.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      }
      throw new Error(errorMessage);
    }
  },

  getSurveyState: async (sessionId: string) => {
    try {
      const response = await api.get(`/api/survey/state/${sessionId}`);
      return response.data;
    } catch (err) {
      let errorMessage = 'An unknown error occurred while fetching survey state.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      }
      throw new Error(errorMessage);
    }
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
