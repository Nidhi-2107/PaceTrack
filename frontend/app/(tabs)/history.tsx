import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { ActivityCard } from '../../src/components/ActivityCard';
import { fetchActivitiesApi, fetchActivityByIdApi } from '../../src/services/api/activityApi';
import { fetchWeeklyAnalyticsApi } from '../../src/services/api/analyticsApi';
import { RouteView } from '../../src/components/RouteView';
import { Activity, WeeklyAnalytics } from '../../src/types/activity';

export default function HistoryScreen() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const loadHistory = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [actList, weekStats] = await Promise.allSettled([
        fetchActivitiesApi(token),
        fetchWeeklyAnalyticsApi(token),
      ]);

      if (actList.status === 'fulfilled') {
        setActivities(actList.value);
      }
      if (weekStats.status === 'fulfilled') {
        setAnalytics(weekStats.value);
      }
    } catch (err) {
      console.warn('History load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleSelectActivity = async (item: Activity) => {
    if (selectedActivity?.id === item.id) {
      setSelectedActivity(null);
      return;
    }

    if (!token) return;
    setLoadingDetail(true);
    try {
      const detailed = await fetchActivityByIdApi(token, item.id);
      setSelectedActivity(detailed);
    } catch {
      setSelectedActivity(item);
    } finally {
      setLoadingDetail(false);
    }
  };

  const totalDistanceKm = (
    activities.reduce((acc, curr) => acc + curr.distanceMeters, 0) / 1000
  ).toFixed(1);

  const totalCalories = activities.reduce((acc, curr) => acc + curr.caloriesBurned, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryLight}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header Totals Card */}
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>ALL-TIME WORKOUTS</Text>
              <View style={styles.totalsRow}>
                <View style={styles.totalCol}>
                  <Text style={styles.totalValue}>{activities.length}</Text>
                  <Text style={styles.totalLabel}>Workouts</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalCol}>
                  <Text style={styles.totalValue}>{totalDistanceKm}</Text>
                  <Text style={styles.totalLabel}>Total km</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalCol}>
                  <Text style={styles.totalValue}>{totalCalories.toLocaleString()}</Text>
                  <Text style={styles.totalLabel}>Calories</Text>
                </View>
              </View>
            </View>

            {/* Selected Activity Detail with GPS Waypoint Map */}
            {selectedActivity && (
              <View style={styles.detailContainer}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>Workout Route Detail</Text>
                  <TouchableOpacity onPress={() => setSelectedActivity(null)}>
                    <Text style={styles.closeDetail}>✕ Close</Text>
                  </TouchableOpacity>
                </View>
                {loadingDetail ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
                ) : (
                  <RouteView
                    points={selectedActivity.waypoints || []}
                    isActive={false}
                  />
                )}
              </View>
            )}

            <Text style={styles.sectionHeader}>Activity History</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            onPress={() => handleSelectActivity(item)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={Colors.primary}
              size="large"
              style={{ marginTop: 40 }}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏃‍♂️</Text>
              <Text style={styles.emptyTitle}>No Recorded Workouts Yet</Text>
              <Text style={styles.emptySubtitle}>
                Put on your shoes and record your first run or walk using the GPS Tracker tab!
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/track')}
              >
                <Text style={styles.emptyBtnText}>Start Tracking Now</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
  },
  totalsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginBottom: 16,
  },
  totalsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  totalCol: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  totalDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.forestBorder,
  },
  detailContainer: {
    backgroundColor: Colors.forestCard,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  closeDetail: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },
  emptyBtnText: {
    color: Colors.forestDeep,
    fontSize: 13,
    fontWeight: '800',
  },
});
