import axios from 'axios';

// Use VITE_API_URL if set, otherwise use window.location.origin for production
const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? window.location.origin 
    : 'http://localhost:4001');

const clerkApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store the getToken function
let getTokenFn: (() => Promise<string | null>) | null = null;

// Function to set the getToken function from Clerk
export const setClerkGetToken = (getToken: () => Promise<string | null>) => {
  getTokenFn = getToken;
};

// Add Clerk session token to requests
clerkApi.interceptors.request.use(async (config) => {
  try {
    if (getTokenFn) {
      const token = await getTokenFn();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error('Error getting Clerk token:', error);
  }
  
  return config;
});

// Admin API endpoints using Clerk auth
export const clerkAdminApi = {
  // Response management
  getResponses: (page = 1, limit = 10) => 
    clerkApi.get(`/api/clerk-admin/responses?page=${page}&limit=${limit}`),
  
  getResponseDetail: (responseId: string) => 
    clerkApi.get(`/api/clerk-admin/responses/${responseId}`),
  
  exportResponses: (surveyId: string) => 
    clerkApi.get(`/api/clerk-admin/export?surveyId=${surveyId}`, { responseType: 'blob' }),
  
  // Analytics
  getAnalyticsSummary: () => 
    clerkApi.get('/api/clerk-admin/analytics/summary?surveyId=11111111-1111-1111-1111-111111111111'),
};

export default clerkApi;