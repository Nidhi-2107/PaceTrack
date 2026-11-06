import { Config } from '../../constants/config';
import { ApiResponse } from '../../types/health';
import { AuthResponse, LoginData, RegisterData, User } from '../../types/auth';

interface BackendErrorPayload {
  success: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (json && typeof json === 'object') {
      const errPayload = json as BackendErrorPayload;
      if (errPayload.fieldErrors && errPayload.fieldErrors.length > 0) {
        throw new Error(errPayload.fieldErrors.map((f) => `${f.field}: ${f.message}`).join(', '));
      }
      if (errPayload.message) {
        throw new Error(errPayload.message);
      }
    }
    throw new Error(`Request failed with status ${res.status}`);
  }

  const envelope = json as ApiResponse<T>;
  if (!envelope || envelope.data === undefined || envelope.data === null) {
    throw new Error('Malformed API response');
  }

  return envelope.data;
}

export async function registerApi(data: RegisterData): Promise<AuthResponse> {
  const res = await fetch(`${Config.apiBaseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<AuthResponse>(res);
}

export async function loginApi(data: LoginData): Promise<AuthResponse> {
  const res = await fetch(`${Config.apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<AuthResponse>(res);
}

export async function fetchCurrentUserApi(token: string): Promise<User> {
  const res = await fetch(`${Config.apiBaseUrl}/users/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return handleResponse<User>(res);
}

