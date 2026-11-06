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
  const isSyncInProgressRef = useRef<boolean>(false);
  const subscriptionRef = useRef<Pedometer.Subscription | null>(null);
  const baselineHistoricalStepsRef = useRef<number>(0);

  // Check hardware sensor availability and request permission
  const checkSensor = useCallback(async () => {
    try {
      const available = await Pedometer.isAvailableAsync();
      setIsAvailable(available);

      if (!available) {
        // Transparent disclosure: hardware not present (e.g. web browser, emulator)
        setError('Physical step pedometer hardware is not available on this device.');
        return;
      }

      const { status } = await Pedometer.requestPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);

      if (!granted) {
        setError('Activity recognition permission was denied in device settings.');
        return;
      }

      setError(null);

      // Query steps taken today so far
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();

      try {
        const pastStepResult = await Pedometer.getStepCountAsync(startOfDay, endOfDay);
        if (pastStepResult && typeof pastStepResult.steps === 'number') {
          baselineHistoricalStepsRef.current = pastStepResult.steps;
          setStepCount(pastStepResult.steps);
        }
      } catch {
        // Some Android devices do not support historical window queries
        baselineHistoricalStepsRef.current = 0;
      }

      // Clean up previous subscription if any
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      // Subscribe to real-time live step counter events
      subscriptionRef.current = Pedometer.watchStepCount((result) => {
        setStepCount((prev) => {
          const newTotal = prev + result.steps;
          return newTotal;
        });
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error accessing motion pedometer';
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

  // Sync to backend with debounce and race-condition guards
  const syncToBackend = useCallback(
    async (currentStepsOverride?: number) => {
      if (!token) return;
      const count = currentStepsOverride !== undefined ? currentStepsOverride : stepCount;

      // Avoid redundant API calls if steps haven't changed since last sync
      if (count === lastSyncedStepsRef.current && count > 0) return;
      if (count <= 0 && lastSyncedStepsRef.current === 0) return;

      // Prevent concurrent sync requests
      if (isSyncInProgressRef.current) return;
      isSyncInProgressRef.current = true;
      setIsSyncing(true);

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        // Standard average stride length approx 0.76m
        const estimatedDistanceMeters = Math.round(count * 0.76 * 10) / 10;
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
        console.warn('Pedometer sync warning:', err);
      } finally {
        isSyncInProgressRef.current = false;
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
