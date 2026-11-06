import { useState, useEffect, useCallback, useRef } from 'react';
import { Pedometer } from 'expo-sensors';
import { syncStepsApi } from '../api/stepsApi';

interface UsePedometerProps {
  token?: string | null;
  autoSyncIntervalMs?: number;
}

export function usePedometer({ token, autoSyncIntervalMs = 60000 }: UsePedometerProps = {}) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [stepCount, setStepCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const lastSyncedStepsRef = useRef<number>(0);
  const subscriptionRef = useRef<Pedometer.Subscription | null>(null);

  // Check hardware sensor availability and request permission
  const checkSensor = useCallback(async () => {
    try {
      const available = await Pedometer.isAvailableAsync();
      setIsAvailable(available);

      if (!available) {
        setError('Pedometer hardware is not available on this device/simulator. Steps cannot be measured automatically.');
        return;
      }

      const { status } = await Pedometer.requestPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);

      if (!granted) {
        setError('Motion & Fitness permission was denied. Enable permission in device settings to track steps.');
        return;
      }

      setError(null);

      // Query steps taken today so far
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();

      try {
        const pastStepResult = await Pedometer.getStepCountAsync(startOfDay, endOfDay);
        if (pastStepResult) {
          setStepCount(pastStepResult.steps);
        }
      } catch {
        // Some devices don't support historical queries, but do support live updates
      }

      // Subscribe to real-time live step updates
      subscriptionRef.current = Pedometer.watchStepCount((result) => {
        setStepCount((prev) => prev + result.steps);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error accessing pedometer';
      setError(msg);
      setIsAvailable(false);
    }
  }, []);

  useEffect(() => {
    checkSensor();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [checkSensor]);

  // Sync to backend periodically or when user initiates
  const syncToBackend = useCallback(
    async (currentStepsOverride?: number) => {
      if (!token) return;
      const count = currentStepsOverride !== undefined ? currentStepsOverride : stepCount;
      if (count <= 0 && lastSyncedStepsRef.current === 0) return;

      setIsSyncing(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        // Standard average stride length approx 0.76 meters per step
        const estimatedDistanceMeters = count * 0.76;
        // Standard average ~0.04 kcal per step
        const estimatedCalories = Math.round(count * 0.04);

        await syncStepsApi(token, {
          recordDate: todayStr,
          stepCount: count,
          distanceMeters: estimatedDistanceMeters,
          caloriesBurned: estimatedCalories,
        });

        lastSyncedStepsRef.current = count;
      } catch (err: unknown) {
        // Silently log or handle sync error
        console.warn('Step sync failed:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [token, stepCount]
  );

  // Auto-sync interval
  useEffect(() => {
    if (!token || autoSyncIntervalMs <= 0) return;

    const interval = setInterval(() => {
      if (stepCount !== lastSyncedStepsRef.current) {
        syncToBackend(stepCount);
      }
    }, autoSyncIntervalMs);

    return () => clearInterval(interval);
  }, [token, stepCount, autoSyncIntervalMs, syncToBackend]);

  return {
    isAvailable,
    permissionGranted,
    stepCount,
    error,
    isSyncing,
    checkSensor,
    syncToBackend,
    setManualStepCount: setStepCount,
  };
}
