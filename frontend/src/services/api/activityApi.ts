import { Config } from '../../constants/config';
import { ApiResponse } from '../../types/health';
import { Activity, CreateActivityInput } from '../../types/activity';

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (json && typeof json === 'object') {
      const err = json as { message?: string; error?: string };
      if (err.message) throw new Error(err.message);
    }
    throw new Error(`Request failed with status ${res.status}`);
  }

  const envelope = json as ApiResponse<T>;
  if (!envelope || envelope.data === undefined || envelope.data === null) {
    throw new Error('Malformed API response');
  }

  return envelope.data as T;
}

export async function createActivityApi(
  token: string,
  input: CreateActivityInput
): Promise<Activity> {
  const res = await fetch(`${Config.apiBaseUrl}/activities`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });

  return handleResponse<Activity>(res);
}

export async function fetchActivitiesApi(token: string): Promise<Activity[]> {
  const res = await fetch(`${Config.apiBaseUrl}/activities`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return handleResponse<Activity[]>(res);
}

export async function fetchActivityByIdApi(token: string, id: string): Promise<Activity> {
  const res = await fetch(`${Config.apiBaseUrl}/activities/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return handleResponse<Activity>(res);
}
