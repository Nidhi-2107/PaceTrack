export type ActivityType = 'WALKING' | 'RUNNING' | 'CYCLING' | 'HIKING';

export type PrivacyLevel = 'PRIVATE' | 'FRIENDS_ONLY' | 'PUBLIC';

export interface Waypoint {
  id?: string;
  sequenceOrder: number;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speedMps?: number | null;
  timestamp: string;
}

export interface Activity {
  id: string;
  userId: string;
  activityType: ActivityType;
  title: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceMeters: number;
  avgPaceSecondsPerKm: number;
  caloriesBurned: number;
  stepCount: number;
  privacyLevel: PrivacyLevel;
  createdAt: string;
  waypoints?: Waypoint[];
}

export interface CreateActivityInput {
  activityType: ActivityType;
  title: string;
  startTime: string;
  endTime: string;
  distanceMeters: number;
  stepCount?: number;
  privacyLevel?: PrivacyLevel;
  idempotencyKey?: string;
  waypoints?: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    speedMps?: number | null;
    timestamp: string;
  }[];
}

export interface DailyStepRecord {
  id?: string | null;
  recordDate: string; // YYYY-MM-DD
  stepCount: number;
  distanceMeters: number;
  caloriesBurned: number;
}

export interface StepSyncInput {
  recordDate: string;
  stepCount: number;
  distanceMeters: number;
  caloriesBurned?: number;
}

export interface WeeklyAnalytics {
  totalActivities: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalCaloriesBurned: number;
  totalSteps: number;
  dailySteps: DailyStepRecord[];
  recentActivities: Activity[];
}

export interface Goal {
  id: string;
  goalType: string; // e.g. "DAILY_STEPS"
  targetValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  goalType: string;
  targetValue: number;
}
