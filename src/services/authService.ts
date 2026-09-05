const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Falha ao autenticar com o Google');
    }

    return response.json();
  }
};
