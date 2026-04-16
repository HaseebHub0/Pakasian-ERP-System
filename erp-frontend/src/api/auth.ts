import client from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    role_name: string | null;
    permissions: string[];
  };
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    client.post<AuthResponse>('/api/auth/login/', credentials),

  logout: (refreshToken?: string) =>
    client.post('/api/auth/logout/', { refresh_token: refreshToken }),

  refresh: (refreshToken: string) =>
    client.post<{ access_token: string }>('/api/auth/refresh/', {
      refresh_token: refreshToken,
    }),

  me: () => client.get('/api/auth/me/'),
};

export default authApi;
