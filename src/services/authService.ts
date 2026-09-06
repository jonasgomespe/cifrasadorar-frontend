import { apiFetch } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  picture?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    return apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }
};
