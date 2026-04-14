import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: add Authorization Bearer token
client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and 400/422
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    if (error.response?.status === 400 || error.response?.status === 422) {
      // Extract DRF error format
      const data = error.response.data;
      let message = 'Validation Error';
      
      if (typeof data === 'object' && data !== null) {
        // Collect all error messages from the DRF object
        const messages = Object.entries(data)
          .map(([key, val]) => {
             const valMsg = Array.isArray(val) ? val.join(' ') : String(val);
             return key === 'non_field_errors' || key === 'detail' 
               ? valMsg 
               : `${key}: ${valMsg}`;
          });
        if (messages.length > 0) message = messages.join(' | ');
      } else if (typeof data === 'string') {
        message = data;
      }
      
      return Promise.reject(new Error(message));
    }
    
    return Promise.reject(error);
  }
);

export default client;
