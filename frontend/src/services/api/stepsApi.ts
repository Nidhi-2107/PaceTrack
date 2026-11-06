import { Config } from '../../constants/config';
import { ApiResponse } from '../../types/health';
import { DailyStepRecord, StepSyncInput } from '../../types/activity';

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

export async function fetchTodayStepsApi(token: string): Promise<DailyStepRecord> {
  const res = await fetch(`${Config.apiBaseUrl}/steps/today`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  return handleResponse<DailyStepRecord>(res);
}

export async function syncStepsApi(token: string, input: StepSyncInput): Promise<DailyStepRecord> {
  const res = await fetch(`${Config.apiBaseUrl}/steps/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });

  return handleResponse<DailyStepRecord>(res);
}
