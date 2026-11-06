import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity } from '../types/activity';
import { Colors } from '../constants/colors';

interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onPress }) => {
  const isRunning = activity.activityType === 'RUNNING';
  const typeIcon = isRunning ? '🏃' : '🚶';
  const distanceKm = (activity.distanceMeters / 1000).toFixed(2);

  // Format duration mm:ss or hh:mm:ss
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Format pace mm'ss" /km
  const formatPace = (paceSecPerKm: number) => {
    if (!paceSecPerKm || paceSecPerKm <= 0 || !isFinite(paceSecPerKm)) return "--'--\"";
    const mins = Math.floor(paceSecPerKm / 60);
    const secs = Math.floor(paceSecPerKm % 60);
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

  const formattedDate = new Date(activity.startTime).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <Text style={styles.typeName}>{activity.activityType}</Text>
        </View>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <Text style={styles.title}>{activity.title}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCol}>
          <Text style={styles.statValue}>{distanceKm} <Text style={styles.statUnit}>km</Text></Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>

        <View style={styles.statCol}>
          <Text style={styles.statValue}>{formatDuration(activity.durationSeconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>

        <View style={styles.statCol}>
          <Text style={styles.statValue}>{formatPace(activity.avgPaceSecondsPerKm)}</Text>
          <Text style={styles.statLabel}>Avg Pace</Text>
        </View>

        <View style={styles.statCol}>
          <Text style={styles.statValue}>{activity.caloriesBurned} <Text style={styles.statUnit}>kcal</Text></Text>
          <Text style={styles.statLabel}>Burned</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mintBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  typeIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  typeName: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  date: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.forestDeep,
    borderRadius: 10,
    padding: 10,
  },
  statCol: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});

