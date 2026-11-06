import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { StepProgressRing } from '../../src/components/StepProgressRing';
import { MetricCard } from '../../src/components/MetricCard';
import { WeeklyStatsChart } from '../../src/components/WeeklyStatsChart';
import { fetchTodayStepsApi } from '../../src/services/api/stepsApi';
import { fetchWeeklyAnalyticsApi } from '../../src/services/api/analyticsApi';
import { fetchGoalsApi } from '../../src/services/api/goalsApi';
import { usePedometer } from '../../src/services/sensor/usePedometer';
import { DailyStepRecord, WeeklyAnalytics, Goal } from '../../src/types/activity';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [todaySteps, setTodaySteps] = useState<DailyStepRecord | null>(null);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number>(10000);

  // Hardware pedometer sensor hook
  const {
    isAvailable: sensorAvailable,
    stepCount: liveSensorSteps,
    syncToBackend,
    isSyncing,
  } = usePedometer({ token });

  const loadDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [stepsData, analyticsData, goalsData] = await Promise.allSettled([
        fetchTodayStepsApi(token),
        fetchWeeklyAnalyticsApi(token),
        fetchGoalsApi(token),
      ]);

      if (stepsData.status === 'fulfilled') {
        setTodaySteps(stepsData.value);
      }
      if (analyticsData.status === 'fulfilled') {
        setWeeklyAnalytics(analyticsData.value);
      }
      if (goalsData.status === 'fulfilled' && goalsData.value.length > 0) {
        const stepGoal = goalsData.value.find((g: Goal) => g.goalType === 'DAILY_STEPS');
        if (stepGoal) {
          setDailyGoal(stepGoal.targetValue);
        }
      }
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (liveSensorSteps > 0) {
      await syncToBackend(liveSensorSteps);
    }
    await loadDashboardData();
  };

  // Determine effective displayed steps: highest of backend recorded steps or live hardware pedometer
  const backendCount = todaySteps ? todaySteps.stepCount : 0;
  const effectiveSteps = Math.max(backendCount, liveSensorSteps);
  const distanceKm = todaySteps && todaySteps.distanceMeters > 0
    ? todaySteps.distanceMeters / 1000
    : (effectiveSteps * 0.76) / 1000;
  const caloriesBurned = todaySteps && todaySteps.caloriesBurned > 0
    ? todaySteps.caloriesBurned
    : Math.round(effectiveSteps * 0.04);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryLight}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Hello, ${user.firstName}` : 'Welcome to PaceTrack'}
            </Text>
            <Text style={styles.subGreeting}>Move More. Track Better.</Text>
          </View>
          <View style={styles.headerPills}>
            {sensorAvailable === true && (
              <View style={styles.sensorBadge}>
                <Text style={styles.sensorDot}>●</Text>
                <Text style={styles.sensorText}>Sensor Active</Text>
              </View>
            )}
            {isSyncing && (
              <View style={[styles.sensorBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <ActivityIndicator size="small" color={Colors.warning} style={{ transform: [{ scale: 0.6 }] }} />
                <Text style={[styles.sensorText, { color: Colors.warning }]}>Syncing</Text>
              </View>
            )}
          </View>
        </View>

        {/* Daily Step Progress Ring */}
        <StepProgressRing
          currentSteps={effectiveSteps}
          goalSteps={dailyGoal}
          distanceKm={distanceKm}
          caloriesBurned={caloriesBurned}
        />

        {/* Hardware Pedometer Status Notice */}
        {sensorAvailable === false && (
          <View style={styles.sensorNotice}>
            <Text style={styles.sensorNoticeIcon}>ℹ️</Text>
            <Text style={styles.sensorNoticeText}>
              Hardware step pedometer not detected on this browser/simulator. Real GPS distance and steps from activities are tracked automatically when you start an activity.
            </Text>
          </View>
        )}

        {/* Quick Activity Actions */}
        <Text style={styles.sectionTitle}>Start Activity</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.activityActionBtn, styles.runBtn]}
            onPress={() => router.push({ pathname: '/(tabs)/track', params: { type: 'RUNNING' } })}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>🏃</Text>
            </View>
            <View>
              <Text style={styles.actionTitle}>Start Run</Text>
              <Text style={styles.actionSubtitle}>GPS pace & distance</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.activityActionBtn, styles.walkBtn]}
            onPress={() => router.push({ pathname: '/(tabs)/track', params: { type: 'WALKING' } })}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>🚶</Text>
            </View>
            <View>
              <Text style={styles.actionTitle}>Start Walk</Text>
              <Text style={styles.actionSubtitle}>Route & cadence</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Metric Cards Grid */}
        <Text style={styles.sectionTitle}>Today's Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="📏"
            label="Distance"
            value={distanceKm.toFixed(2)}
            unit="km"
            subValue={`Target ${(dailyGoal * 0.00076).toFixed(1)} km`}
            accentColor={Colors.accentBlue}
          />
          <MetricCard
            icon="🔥"
            label="Calories"
            value={caloriesBurned}
            unit="kcal"
            subValue="Estimated burn"
            accentColor={Colors.accent}
          />
        </View>

        {/* Weekly Progress Section */}
        <Text style={styles.sectionTitle}>This Week's Activity</Text>
        <WeeklyStatsChart
          dailySteps={weeklyAnalytics?.dailySteps || []}
          targetSteps={dailyGoal}
        />

        {/* Weekly Stats Summary Card */}
        {weeklyAnalytics && (
          <View style={styles.weeklySummaryCard}>
            <View style={styles.weeklyMetric}>
              <Text style={styles.weeklyMetricValue}>{weeklyAnalytics.totalActivities}</Text>
              <Text style={styles.weeklyMetricLabel}>Workouts</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyMetric}>
              <Text style={styles.weeklyMetricValue}>
                {(weeklyAnalytics.totalDistanceMeters / 1000).toFixed(1)}
              </Text>
              <Text style={styles.weeklyMetricLabel}>Total km</Text>
            </View>
            <View style={styles.weeklyDivider} />
            <View style={styles.weeklyMetric}>
              <Text style={styles.weeklyMetricValue}>
                {Math.round(weeklyAnalytics.totalDurationSeconds / 60)}
              </Text>
              <Text style={styles.weeklyMetricLabel}>Active mins</Text>
            </View>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerPills: {
    flexDirection: 'row',
    gap: 6,
  },
  sensorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mintBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  sensorDot: {
    color: Colors.primaryLight,
    fontSize: 8,
    marginRight: 4,
  },
  sensorText: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  sensorNotice: {
    flexDirection: 'row',
    backgroundColor: Colors.forestCard,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginVertical: 8,
    alignItems: 'center',
  },
  sensorNoticeIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  sensorNoticeText: {
    color: Colors.textMuted,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activityActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  runBtn: {
    backgroundColor: Colors.forestCard,
    borderColor: Colors.primaryDark,
  },
  walkBtn: {
    backgroundColor: Colors.forestCard,
    borderColor: Colors.forestBorder,
  },
  actionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  weeklySummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginTop: 8,
  },
  weeklyMetric: {
    alignItems: 'center',
  },
  weeklyMetricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  weeklyMetricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  weeklyDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.forestBorder,
    alignSelf: 'center',
  },
});
