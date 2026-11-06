import { Config } from '../../constants/config';
import { ApiResponse } from '../../types/health';
import { WeeklyAnalytics } from '../../types/activity';

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

export async function fetchWeeklyAnalyticsApi(token: string): Promise<WeeklyAnalytics> {
  const res = await fetch(`${Config.apiBaseUrl}/analytics/weekly`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return handleResponse<WeeklyAnalytics>(res);
}
