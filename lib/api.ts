import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('oneclick_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('oneclick_token');
      localStorage.removeItem('oneclick_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  me: () => api.get('/api/auth/me'),
};

export const scheduleApi = {
  getToday: () => api.get('/api/schedule/today'),
  getDashboard: () => api.get('/api/schedule/dashboard'),
};

export const patientApi = {
  list: (search?: string) => api.get('/api/patients/', { params: { search } }),
  get: (id: string) => api.get(`/api/patients/${id}`),
  getPaRequests: (id: string) => api.get(`/api/patients/${id}/pa-requests`),
};

export const paApi = {
  quickReview: (data: any) => api.post('/api/pa-requests/quick-review', data),
  aiAnalysis: (data: any) => api.post('/api/pa-requests/ai-analysis', data),
  getFormSelection: (payerId: string, cptCode: string, icd10Code: string) =>
    api.get('/api/pa-requests/form-selection', { params: { payer_id: payerId, cpt_code: cptCode, icd10_code: icd10Code } }),
  create: (data: any) => api.post('/api/pa-requests/create', data),
  submit: (data: any) => api.post('/api/pa-requests/submit', data),
  list: (params?: any) => api.get('/api/pa-requests/', { params }),
  get: (id: string) => api.get(`/api/pa-requests/${id}`),
  reviewDecision: (data: any) => api.post('/api/pa-requests/review-decision', data),
};

export const codesApi = {
  searchCpt: (q: string, limit = 20) => api.get('/api/codes/cpt', { params: { q, limit } }),
  getCpt: (code: string) => api.get(`/api/codes/cpt/${code}`),
  searchIcd10: (q: string, limit = 20) => api.get('/api/codes/icd10', { params: { q, limit } }),
  getIcd10: (code: string) => api.get(`/api/codes/icd10/${code}`),
  searchHcpcs: (q: string, limit = 20) => api.get('/api/codes/hcpcs', { params: { q, limit } }),
};

export const fhirApi = {
  status: () => api.get('/api/fhir/status'),
  syncPatients: (limit = 50) => api.post('/api/fhir/sync/patients', null, { params: { limit } }),
  syncPatient: (fhirId: string) => api.post(`/api/fhir/sync/patient/${fhirId}`),
  searchPatients: (params: any) => api.get('/api/fhir/search/patients', { params }),
};

export const payerApi = {
  list: () => api.get('/api/payers/'),
};

export const payerPortalApi = {
  getIntakeQueue: () => api.get('/api/payer/intake/queue'),
  getIntakeReview: (id: string) => api.get(`/api/payer/intake/review/${id}`),
  reviewIntake: (id: string, data: any) => api.post(`/api/payer/intake/review/${id}`, data),
  getClinicalQueue: () => api.get('/api/payer/clinical/queue'),
  getClinicalReview: (id: string) => api.get(`/api/payer/clinical/review/${id}`),
  reviewClinical: (id: string, data: any) => api.post(`/api/payer/clinical/review/${id}`, data),
  getDecisionQueue: () => api.get('/api/payer/decision/queue'),
  getDecisionReview: (id: string) => api.get(`/api/payer/decision/review/${id}`),
  reviewDecision: (id: string, data: any) => api.post(`/api/payer/decision/review/${id}`, data),
  getStats: () => api.get('/api/payer/stats/performance'),
};

export const notificationsApi = {
  list: () => api.get('/api/notifications/'),
  markRead: (id: string) => api.post(`/api/notifications/${id}/read`),
};
