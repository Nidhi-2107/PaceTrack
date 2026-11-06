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

// Haversine formula to compute great-circle distance in meters
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's mean radius in meters
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

  // High-precision wall-clock timing refs (avoids setInterval throttling drift)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeMsRef = useRef<number | null>(null);
  const accumulatedPausedMsRef = useRef<number>(0);
  const pauseStartMsRef = useRef<number | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const isFirstFixAfterResumeRef = useRef<boolean>(false);
  const lastPointRef = useRef<GpsPoint | null>(null);

  // Request & verify location permission
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
        setPermissionError(
          'Location permission denied. PaceTrack requires GPS access to record real workout distance, pace, and route.'
        );
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

  // Wall-clock accurate timer
  useEffect(() => {
    if (status === 'TRACKING') {
      timerRef.current = setInterval(() => {
        if (startTimeMsRef.current !== null) {
          const now = Date.now();
          const activeMs = now - startTimeMsRef.current - accumulatedPausedMsRef.current;
          const secs = Math.max(0, Math.floor(activeMs / 1000));
          setElapsedSeconds(secs);
        }
      }, 500); // 500ms sampling for crisp UI display
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Internal helper to attach location listener
  const attachLocationListener = async () => {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 4, // minimum 4 meters between fixes
        timeInterval: 2000,  // minimum 2 seconds between updates
      },
      (loc) => {
        // 1. Accuracy filter: discard low-precision fixes (> 30 meters)
        if (loc.coords.accuracy && loc.coords.accuracy > 30) {
          return;
        }

        const fixTime = loc.timestamp ? new Date(loc.timestamp) : new Date();
        const rawSpeed = loc.coords.speed !== null && loc.coords.speed !== undefined ? loc.coords.speed : 0;
        const sanitizedSpeed = rawSpeed > 0 ? rawSpeed : 0;

        const newPoint: GpsPoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude,
          speedMps: sanitizedSpeed,
          timestamp: fixTime.toISOString(),
        };

        // If this is the very first fix after resuming from pause, update position without jump distance
        if (isFirstFixAfterResumeRef.current) {
          isFirstFixAfterResumeRef.current = false;
          lastPointRef.current = newPoint;
          setWaypoints((prev) => [...prev, newPoint]);
          return;
        }

        if (lastPointRef.current) {
          const prevPoint = lastPointRef.current;
          const deltaMeters = calculateDistanceMeters(
            prevPoint.latitude,
            prevPoint.longitude,
            newPoint.latitude,
            newPoint.longitude
          );

          const timeDeltaSeconds =
            (new Date(newPoint.timestamp).getTime() - new Date(prevPoint.timestamp).getTime()) / 1000;

          // 2. Velocity sanity check: discard superhuman jumps (> 14 m/s ≈ 50 km/h)
          if (timeDeltaSeconds > 0 && deltaMeters / timeDeltaSeconds > 14) {
            return;
          }

          // 3. Stationary jitter suppression: ignore microscopic movements < 2m when speed is near zero
          const isJitter = deltaMeters < 2.0 && sanitizedSpeed < 0.4;

          if (!isJitter && deltaMeters >= 1.5) {
            setDistanceMeters((prevDist) => {
              const newTotal = prevDist + deltaMeters;
              // Recalculate pace using latest elapsed seconds
              const distKm = newTotal / 1000;
              if (distKm > 0.02) {
                const nowSec = startTimeMsRef.current
                  ? Math.floor((Date.now() - startTimeMsRef.current - accumulatedPausedMsRef.current) / 1000)
                  : 1;
                setCurrentPaceSecPerKm(nowSec / distKm);
              }
              return newTotal;
            });
          }
        }

        lastPointRef.current = newPoint;
        setWaypoints((prev) => [...prev, newPoint]);
        setCurrentSpeedKmh(sanitizedSpeed * 3.6);
      }
    );

    return sub;
  };

  // Start tracking
  const startTracking = async (type: ActivityType = 'RUNNING') => {
    const hasPerm = await checkPermission();
    if (!hasPerm) return;

    // Reset state & timing refs
    setActivityType(type);
    setElapsedSeconds(0);
    setDistanceMeters(0);
    setCurrentPaceSecPerKm(0);
    setCurrentSpeedKmh(0);
    setWaypoints([]);
    lastPointRef.current = null;
    isFirstFixAfterResumeRef.current = false;

    const now = Date.now();
    startTimeMsRef.current = now;
    accumulatedPausedMsRef.current = 0;
    pauseStartMsRef.current = null;

    // Generate unique idempotency key
    idempotencyKeyRef.current = `act_${now}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const sub = await attachLocationListener();
      locationSubRef.current = sub;
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

    pauseStartMsRef.current = Date.now();
    setStatus('PAUSED');
  };

  // Resume tracking
  const resumeTracking = async () => {
    if (status !== 'PAUSED') return;

    if (pauseStartMsRef.current !== null) {
      accumulatedPausedMsRef.current += Date.now() - pauseStartMsRef.current;
      pauseStartMsRef.current = null;
    }

    // Flag that the next fix should not add jump distance
    isFirstFixAfterResumeRef.current = true;

    try {
      const sub = await attachLocationListener();
      locationSubRef.current = sub;
      setStatus('TRACKING');
    } catch {
      setStatus('PAUSED');
    }
  };

  // Stop tracking and prepare structured activity payload
  const stopTracking = (): CreateActivityInput | null => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Accumulate final pause duration if stopped while paused
    if (pauseStartMsRef.current !== null) {
      accumulatedPausedMsRef.current += Date.now() - pauseStartMsRef.current;
      pauseStartMsRef.current = null;
    }

    setStatus('COMPLETED');

    const endTime = new Date();
    const startTime = startTimeMsRef.current
      ? new Date(startTimeMsRef.current)
      : new Date(endTime.getTime() - elapsedSeconds * 1000);

    const title = `${activityType === 'RUNNING' ? 'Run' : 'Walk'} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Realistic steps based on average human stride of 0.78m
    const estimatedSteps = distanceMeters > 0 ? Math.round(distanceMeters / 0.78) : 0;

    return {
      activityType,
      title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      distanceMeters: Math.round(distanceMeters * 10) / 10,
      stepCount: estimatedSteps,
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
    lastPointRef.current = null;
    startTimeMsRef.current = null;
    accumulatedPausedMsRef.current = 0;
    pauseStartMsRef.current = null;
    idempotencyKeyRef.current = null;
    isFirstFixAfterResumeRef.current = false;
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
