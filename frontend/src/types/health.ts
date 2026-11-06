export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

export interface HealthData {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  details?: {
    javaVersion?: string;
    os?: string;
    uptimeMs?: number;
    [key: string]: unknown;
  };
}

export interface SystemHealthState {
  loading: boolean;
  connected: boolean;
  data: HealthData | null;
  error: string | null;
  lastChecked: Date | null;
}
