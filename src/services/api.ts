export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.cifrasadorar.applabs.pro/api';

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  // Se a resposta for vazia (ex: 204 No Content), não tenta fazer o parse do json.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
