import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useGpsTracker } from '../../src/services/tracker/useGpsTracker';
import { createActivityApi } from '../../src/services/api/activityApi';
import { RouteView } from '../../src/components/RouteView';
import { ActivityType } from '../../src/types/activity';

export default function TrackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { token, isAuthenticated } = useAuth();

  const [selectedType, setSelectedType] = useState<ActivityType>(
    params.type === 'WALKING' ? 'WALKING' : 'RUNNING'
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const {
    status,
    activityType,
    elapsedSeconds,
    distanceMeters,
    currentPaceSecPerKm,
    currentSpeedKmh,
    waypoints,
    permissionError,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetTracker,
  } = useGpsTracker();

  // If params changed from external navigation
  useEffect(() => {
    if (params.type && (params.type === 'RUNNING' || params.type === 'WALKING')) {
      setSelectedType(params.type as ActivityType);
    }
  }, [params.type]);

  // Format stopwatch mm:ss or hh:mm:ss
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format pace mm'ss" /km
  const formatPace = (paceSec: number) => {
    if (!paceSec || paceSec <= 0 || !isFinite(paceSec)) return "--'--\"";
    const mins = Math.floor(paceSec / 60);
    const secs = Math.floor(paceSec % 60);
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

  const distanceKm = (distanceMeters / 1000).toFixed(2);

  // Stop activity & save to backend
  const handleStopAndSave = async () => {
    const activityInput = stopTracking();
    if (!activityInput) return;

    if (!token) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to save your activity history to the PaceTrack cloud.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSaving(true);
    setSaveSuccessMessage(null);

    try {
      const saved = await createActivityApi(token, activityInput);
      setSaveSuccessMessage(`Workout saved! ${saved.title} (${(saved.distanceMeters / 1000).toFixed(2)} km)`);
      setTimeout(() => {
        resetTracker();
        router.push('/(tabs)/history');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save activity';
      Alert.alert('Save Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tracking Mode Header */}
        <View style={styles.topBar}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                selectedType === 'RUNNING' && styles.typeOptionActive,
              ]}
              disabled={status !== 'IDLE'}
              onPress={() => setSelectedType('RUNNING')}
            >
              <Text style={styles.typeText}>🏃 Run</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                selectedType === 'WALKING' && styles.typeOptionActive,
              ]}
              disabled={status !== 'IDLE'}
              onPress={() => setSelectedType('WALKING')}
            >
              <Text style={styles.typeText}>🚶 Walk</Text>
            </TouchableOpacity>
          </View>

          {/* Status Indicator */}
          <View
            style={[
              styles.statusPill,
              status === 'TRACKING' && styles.statusPillActive,
              status === 'PAUSED' && styles.statusPillPaused,
            ]}
          >
            <Text style={styles.statusDot}>●</Text>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        {/* Foreground Tracking Notice */}
        <View style={styles.foregroundNotice}>
          <Text style={styles.noticeIcon}>⚡</Text>
          <Text style={styles.noticeText}>
            Foreground GPS Mode. Keep screen active while tracking to ensure uninterrupted GPS coordinate logging.
          </Text>
        </View>

        {/* Permission Error Display */}
        {permissionError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {permissionError}</Text>
          </View>
        )}

        {/* Big Metrics Display */}
        <View style={styles.metricsHeroCard}>
          <Text style={styles.mainTimerLabel}>ELAPSED TIME</Text>
          <Text style={styles.mainTimerValue}>{formatTime(elapsedSeconds)}</Text>

          <View style={styles.subMetricsRow}>
            <View style={styles.subMetricCol}>
              <Text style={styles.subMetricValue}>{distanceKm}</Text>
              <Text style={styles.subMetricLabel}>KILOMETERS</Text>
            </View>

            <View style={styles.subDivider} />

            <View style={styles.subMetricCol}>
              <Text style={styles.subMetricValue}>{formatPace(currentPaceSecPerKm)}</Text>
              <Text style={styles.subMetricLabel}>AVG PACE /KM</Text>
            </View>

            <View style={styles.subDivider} />

            <View style={styles.subMetricCol}>
              <Text style={styles.subMetricValue}>{currentSpeedKmh.toFixed(1)}</Text>
              <Text style={styles.subMetricLabel}>SPEED KM/H</Text>
            </View>
          </View>
        </View>

        {/* Live GPS Route breadcrumb view */}
        <RouteView points={waypoints} isActive={status === 'TRACKING'} />

        {/* Save confirmation message */}
        {saveSuccessMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>✓ {saveSuccessMessage}</Text>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controlsArea}>
          {status === 'IDLE' && (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => startTracking(selectedType)}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>
                START {selectedType === 'RUNNING' ? 'RUN' : 'WALK'}
              </Text>
            </TouchableOpacity>
          )}

          {status === 'TRACKING' && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.pauseBtn]}
                onPress={pauseTracking}
                activeOpacity={0.8}
              >
                <Text style={styles.pauseBtnText}>PAUSE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.stopBtn]}
                onPress={handleStopAndSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.stopBtnText}>FINISH & SAVE</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {status === 'PAUSED' && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.resumeBtn]}
                onPress={resumeTracking}
                activeOpacity={0.8}
              >
                <Text style={styles.resumeBtnText}>RESUME</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.stopBtn]}
                onPress={handleStopAndSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.stopBtnText}>FINISH & SAVE</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {status === 'COMPLETED' && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={resetTracker}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>START NEW ACTIVITY</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.forestCard,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  typeOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeOptionActive: {
    backgroundColor: Colors.primaryDark,
  },
  typeText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  statusPillActive: {
    backgroundColor: Colors.mintBadgeBg,
    borderColor: Colors.primary,
  },
  statusPillPaused: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.warning,
  },
  statusDot: {
    fontSize: 8,
    marginRight: 5,
    color: Colors.primaryLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  foregroundNotice: {
    flexDirection: 'row',
    backgroundColor: Colors.forestCard,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginBottom: 12,
    alignItems: 'center',
  },
  noticeIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  noticeText: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 15,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    lineHeight: 16,
  },
  metricsHeroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginBottom: 12,
  },
  mainTimerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  mainTimerValue: {
    fontSize: 54,
    fontWeight: '900',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    letterSpacing: -1,
    marginVertical: 4,
  },
  subMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.forestBorder,
  },
  subMetricCol: {
    alignItems: 'center',
    flex: 1,
  },
  subMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryLight,
  },
  subMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  subDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.forestBorder,
  },
  successBanner: {
    backgroundColor: Colors.mintBadgeBg,
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  successBannerText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  controlsArea: {
    marginTop: 10,
  },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtnText: {
    color: Colors.forestDeep,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  pauseBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  pauseBtnText: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resumeBtn: {
    backgroundColor: Colors.primary,
  },
  resumeBtnText: {
    color: Colors.forestDeep,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stopBtn: {
    backgroundColor: Colors.error,
  },
  stopBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resetBtn: {
    backgroundColor: Colors.forestCard,
    borderColor: Colors.forestBorder,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  resetBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
