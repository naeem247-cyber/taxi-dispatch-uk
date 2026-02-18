import type { AuthResponse, Driver, Job } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export function getStoredToken() {
  return localStorage.getItem('taxi_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('taxi_token', token);
}

export function clearStoredToken() {
  localStorage.removeItem('taxi_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMessage = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      errorMessage = err.message ?? err.error ?? errorMessage;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

export async function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getDrivers() {
  return request<Driver[]>('/drivers');
}

export async function getJobs() {
  return request<Job[]>('/jobs');
}

export { API_BASE_URL };
