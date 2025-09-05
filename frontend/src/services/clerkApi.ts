import axios from 'axios';

// Use VITE_API_URL if defined (including empty string), otherwise use localhost for dev
const API_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:4001';

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
  getResponses: (page = 1, limit = 10, opts?: { status?: string; tests?: 'exclude'|'include'|'only'; cohort?: string }) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (opts?.status && opts.status !== 'all') params.set('status', opts.status);
    if (opts?.tests) params.set('tests', opts.tests);
    if (opts?.cohort) params.set('cohort', opts.cohort);
    return clerkApi.get(`/api/clerk-admin/responses?${params.toString()}`);
  },
  
  getResponseDetail: (responseId: string) => 
    clerkApi.get(`/api/clerk-admin/responses/${responseId}`),
  
  exportResponses: (surveyId: string, opts?: { cohort?: string }) => {
    const params = new URLSearchParams();
    params.set('surveyId', surveyId);
    if (opts?.cohort) params.set('cohort', opts.cohort);
    return clerkApi.get(`/api/clerk-admin/export?${params.toString()}`, { responseType: 'blob' });
  },

  markResponseTest: (responseId: string, isTest: boolean) => 
    clerkApi.patch(`/api/clerk-admin/responses/${responseId}/test`, { isTest }),

  deleteResponse: (responseId: string) => 
    clerkApi.delete(`/api/clerk-admin/responses/${responseId}`),

  deleteResponses: (opts: { all?: boolean; onlyTest?: boolean; confirm: string }) => {
    const params = new URLSearchParams();
    if (opts.all) params.set('all', 'true');
    if (opts.onlyTest) params.set('onlyTest', 'true');
    params.set('confirm', opts.confirm);
    return clerkApi.delete(`/api/clerk-admin/responses?${params.toString()}`);
  },
  
  // Analytics
  getAnalyticsSummary: () => 
    clerkApi.get('/api/clerk-admin/analytics/summary?surveyId=11111111-1111-1111-1111-111111111111'),
  
  getQuestionStats: () =>
    clerkApi.get('/api/clerk-admin/analytics/questions'),
};

export default clerkApi;
