import client from './client';

export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
}

export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    // The backend uses 'username' instead of 'email' for login by default in our custom auth view.
    // If the frontend form passes email, we pass it as username for the moment
    const payload = {
      username: credentials.email || credentials.username,
      password: credentials.password
    };
    const response = await client.post('/api/auth/login/', payload);
    return response.data;
  },
  
  logout: async (refresh_token?: string) => {
    const payload = refresh_token ? { refresh_token } : {};
    const response = await client.post('/api/auth/logout/', payload);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await client.get('/api/auth/me/');
    return response.data;
  },
  
  refresh: async (refresh_token: string) => {
    const response = await client.post('/api/auth/refresh/', { refresh_token });
    return response.data;
  }
};
