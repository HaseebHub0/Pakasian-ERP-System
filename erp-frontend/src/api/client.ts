import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If it's a 401 and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('erp_refresh_token');
      
      if (refreshToken) {
        try {
          // Call refresh endpoint
          const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
            refresh_token: refreshToken
          });
          
          if (response.data.access_token) {
            // Update token in localStorage
            localStorage.setItem('erp_token', response.data.access_token);
            
            // Update auth headers for the original request
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
            
            // Return to re-execute original request with new token
            return client(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, clear everything and redirect
          localStorage.removeItem('erp_token');
          localStorage.removeItem('erp_refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('erp_token');
        window.location.href = '/login';
      }
    }
    
    // Extract DRF error format
    const data = error.response?.data;
    let message = 'An unexpected error occurred';
    
    if (typeof data === 'string') {
      message = data;
    } else if (data?.detail) {
      message = data.detail;
    } else if (data && typeof data === 'object') {
      message = Object.entries(data)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? Object.values(value).join(', ') : value}`)
        .join(' | ');
    }
    
    return Promise.reject(new Error(message));
  }
);

export default client;
