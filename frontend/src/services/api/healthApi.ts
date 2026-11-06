import { Config } from '../../constants/config';
import { ApiResponse, HealthData } from '../../types/health';

export async function fetchBackendHealth(): Promise<HealthData> {
  const url = `${Config.apiBaseUrl}/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const payload: ApiResponse<HealthData> = await response.json();
    if (!payload.data) {
      throw new Error('Invalid response structure from backend health API');
    }

    return payload.data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Connection timed out while reaching backend');
      }
      throw err;
    }
    throw new Error('Unknown network error occurred');
  }
}

