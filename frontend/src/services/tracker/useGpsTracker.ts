import { useState, useRef, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { ActivityType, CreateActivityInput } from '../../types/activity';

export interface GpsPoint {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speedMps?: number | null;
  timestamp: string;
}

export type TrackingStatus = 'IDLE' | 'TRACKING' | 'PAUSED' | 'COMPLETED';

// Haversine formula to calculate distance in meters between two lat/lon points
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function useGpsTracker() {
  const [status, setStatus] = useState<TrackingStatus>('IDLE');
  const [activityType, setActivityType] = useState<ActivityType>('RUNNING');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [currentPaceSecPerKm, setCurrentPaceSecPerKm] = useState<number>(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [waypoints, setWaypoints] = useState<GpsPoint[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  // Request location permission
  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      if (existingStatus === 'granted') {
        setPermissionGranted(true);
        setPermissionError(null);
        return true;
      }

      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      const granted = newStatus === 'granted';
      setPermissionGranted(granted);
      if (!granted) {
        setPermissionError('Location permission denied. Please enable location access in settings to track activities.');
      } else {
        setPermissionError(null);
      }
      return granted;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error requesting location permission';
      setPermissionError(msg);
      setPermissionGranted(false);
      return false;
    }
  }, []);

  // Timer tick for stopwatch
  useEffect(() => {
    if (status === 'TRACKING') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  // Clean up location subscription on unmount
  useEffect(() => {
    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, []);

  // Start tracking
  const startTracking = async (type: ActivityType = 'RUNNING') => {
    const hasPerm = await checkPermission();
    if (!hasPerm) return;

    // Reset state
    setActivityType(type);
    setElapsedSeconds(0);
    setDistanceMeters(0);
    setCurrentPaceSecPerKm(0);
    setCurrentSpeedKmh(0);
    setWaypoints([]);
    startTimeRef.current = new Date();

    // Generate idempotency key
    idempotencyKeyRef.current = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Start location updates
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // update every 5 meters
          timeInterval: 2000,  // or every 2 seconds
        },
        (loc) => {
          // Reject inaccurate GPS fixes (> 35m) to avoid erratic spikes
          if (loc.coords.accuracy && loc.coords.accuracy > 35) {
            return;
          }

          const newPoint: GpsPoint = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            speedMps: loc.coords.speed !== null && loc.coords.speed >= 0 ? loc.coords.speed : 0,
            timestamp: new Date(loc.timestamp).toISOString(),
          };

          setWaypoints((prev) => {
            if (prev.length > 0) {
              const last = prev[prev.length - 1];
              const delta = calculateDistanceMeters(
                last.latitude,
                last.longitude,
                newPoint.latitude,
                newPoint.longitude
              );

              // Ignore minute jitter < 1m
              if (delta >= 1) {
                setDistanceMeters((d) => {
                  const newDist = d + delta;
                  // Update pace
                  setElapsedSeconds((sec) => {
                    const distKm = newDist / 1000;
                    if (distKm > 0.01) {
                      setCurrentPaceSecPerKm(sec / distKm);
                    }
                    return sec;
                  });
                  return newDist;
                });
              }
            }

            return [...prev, newPoint];
          });

          if (loc.coords.speed !== null && loc.coords.speed > 0) {
            setCurrentSpeedKmh(loc.coords.speed * 3.6);
          }
        }
      );

      locationSubRef.current = subscription;
      setStatus('TRACKING');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start GPS tracking';
      setPermissionError(msg);
      setStatus('IDLE');
    }
  };

  // Pause tracking
  const pauseTracking = () => {
    if (status !== 'TRACKING') return;
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    setStatus('PAUSED');
  };

  // Resume tracking
  const resumeTracking = async () => {
    if (status !== 'PAUSED') return;

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 2000,
        },
        (loc) => {
          if (loc.coords.accuracy && loc.coords.accuracy > 35) return;

          const newPoint: GpsPoint = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            speedMps: loc.coords.speed !== null && loc.coords.speed >= 0 ? loc.coords.speed : 0,
            timestamp: new Date(loc.timestamp).toISOString(),
          };

          setWaypoints((prev) => {
            if (prev.length > 0) {
              const last = prev[prev.length - 1];
              const delta = calculateDistanceMeters(
                last.latitude,
                last.longitude,
                newPoint.latitude,
                newPoint.longitude
              );
              if (delta >= 1) {
                setDistanceMeters((d) => d + delta);
              }
            }
            return [...prev, newPoint];
          });
        }
      );

      locationSubRef.current = subscription;
      setStatus('TRACKING');
    } catch {
      setStatus('PAUSED');
    }
  };

  // Stop tracking and prepare activity payload
  const stopTracking = (): CreateActivityInput | null => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStatus('COMPLETED');

    const endTime = new Date();
    const startTime = startTimeRef.current || new Date(endTime.getTime() - elapsedSeconds * 1000);

    const title = `${activityType === 'RUNNING' ? 'Run' : 'Walk'} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    return {
      activityType,
      title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      distanceMeters,
      stepCount: Math.round(distanceMeters * 1.3), // realistic estimation of steps based on stride
      privacyLevel: 'PRIVATE',
      idempotencyKey: idempotencyKeyRef.current || undefined,
      waypoints: waypoints.map((w) => ({
        latitude: w.latitude,
        longitude: w.longitude,
        altitude: w.altitude,
        speedMps: w.speedMps,
        timestamp: w.timestamp,
      })),
    };
  };

  const resetTracker = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus('IDLE');
    setElapsedSeconds(0);
    setDistanceMeters(0);
    setCurrentPaceSecPerKm(0);
    setCurrentSpeedKmh(0);
    setWaypoints([]);
    startTimeRef.current = null;
    idempotencyKeyRef.current = null;
  };

  return {
    status,
    activityType,
    elapsedSeconds,
    distanceMeters,
    currentPaceSecPerKm,
    currentSpeedKmh,
    waypoints,
    permissionGranted,
    permissionError,
    checkPermission,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetTracker,
  };
}
