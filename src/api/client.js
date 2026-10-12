import axios from 'axios';

// Base API configuration: uses env variable if set, otherwise live Render in production, localhost in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_URL
  || (import.meta.env.PROD ? 'https://medicarebook-backend.onrender.com' : 'http://localhost:8000');

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if present
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medicare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 handling (expired session)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear session and dispatch an auth expired event
      if (localStorage.getItem('medicare_token')) {
        localStorage.removeItem('medicare_token');
        localStorage.removeItem('medicare_user');
        window.dispatchEvent(new Event('medicare_auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

// Modular API services
export const authApi = {
  login: (credentials) => client.post('/api/auth/login', credentials),
  register: (userData) => client.post('/api/auth/register', userData),
  getUsers: () => client.get('/api/auth/users'),
  updateUser: (userId, data) => client.put(`/api/auth/user/${userId}`, data),
  deleteUser: (userId) => client.delete(`/api/auth/user/${userId}`),
};

export const doctorApi = {
  list: () => client.get('/api/doctors/list'),
  getProfileByUser: (userId) => client.get(`/api/doctors/profile/user/${userId}`),
  updateProfile: (doctorId, data) => client.put(`/api/doctors/profile/${doctorId}`, data),
  apply: (data) => client.post('/api/doctors/apply', data),
  approve: (doctorId) => client.put(`/api/doctors/approve/${doctorId}`),
  delete: (doctorId) => client.delete(`/api/doctors/${doctorId}`),
};

export const appointmentApi = {
  book: (bookingData) => client.post('/api/doctors/book', bookingData),
  getByUser: (userId) => client.get(`/api/doctors/history/user/${userId}`),
  getByDoctor: (doctorId) => client.get(`/api/doctors/history/doctor/${doctorId}`),
  getAllAdmin: () => client.get('/api/doctors/history/admin/all'),
  updateStatus: (appointmentId, status) => client.put(`/api/doctors/appointment/${appointmentId}`, { status }),
  delete: (appointmentId) => client.delete(`/api/doctors/appointment/${appointmentId}`),
};

export const aiApi = {
  chat: (message, userId) => client.post('/api/ai/chat', { message, userId }),
  health: () => client.get('/api/ai/health'),
};

export default client;
