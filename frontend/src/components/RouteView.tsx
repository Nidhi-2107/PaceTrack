import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';

interface RoutePoint {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speedMps?: number | null;
  timestamp: string;
}

interface RouteViewProps {
  points: RoutePoint[];
  isActive?: boolean;
}

export const RouteView: React.FC<RouteViewProps> = ({ points, isActive = false }) => {
  if (points.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyTitle}>No GPS Waypoints Yet</Text>
        <Text style={styles.emptySubtitle}>
          {isActive
            ? 'Acquiring GPS fix... Keep device moving in an open area.'
            : 'Start an activity to begin recording GPS track points.'}
        </Text>
      </View>
    );
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeDot}>●</Text>
          <Text style={styles.badgeText}>
            {isActive ? 'LIVE GPS ROUTE' : 'RECORDED ROUTE'} ({points.length} pts)
          </Text>
        </View>
        <Text style={styles.coordsSummary}>
          {lastPoint.latitude.toFixed(4)}°, {lastPoint.longitude.toFixed(4)}°
        </Text>
      </View>

      {/* Visual GPS Breadcrumb Track Representation */}
      <View style={styles.mapVisualArea}>
        <View style={styles.trackLine}>
          <View style={styles.pointStart}>
            <Text style={styles.pointLabel}>START</Text>
          </View>
          <View style={styles.connectorLine} />
          {points.length > 2 && (
            <>
              <View style={styles.pointMid}>
                <Text style={styles.midCount}>+{points.length - 2}</Text>
              </View>
              <View style={styles.connectorLine} />
            </>
          )}
          <View style={[styles.pointEnd, isActive && styles.pointLive]}>
            <Text style={styles.pointLabel}>{isActive ? 'CURRENT' : 'FINISH'}</Text>
          </View>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Start Lat/Lon</Text>
            <Text style={styles.statValue}>
              {firstPoint.latitude.toFixed(4)}, {firstPoint.longitude.toFixed(4)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{isActive ? 'Current Lat/Lon' : 'End Lat/Lon'}</Text>
            <Text style={styles.statValue}>
              {lastPoint.latitude.toFixed(4)}, {lastPoint.longitude.toFixed(4)}
            </Text>
          </View>
        </View>
      </View>

      {/* Waypoint History preview */}
      <Text style={styles.tableTitle}>Recent GPS Track Points</Text>
      <ScrollView style={styles.tableScroll} nestedScrollEnabled>
        {points.slice(-5).reverse().map((pt, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.rowSeq}>#{points.length - idx}</Text>
            <Text style={styles.rowCoords}>
              {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}
            </Text>
            <Text style={styles.rowSpeed}>
              {pt.speedMps !== undefined && pt.speedMps !== null
                ? `${(pt.speedMps * 3.6).toFixed(1)} km/h`
                : '--'}
            </Text>
            <Text style={styles.rowTime}>
              {new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginVertical: 8,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mintBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeDot: {
    color: Colors.primaryLight,
    fontSize: 10,
    marginRight: 4,
  },
  badgeText: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  coordsSummary: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  mapVisualArea: {
    backgroundColor: Colors.forestDeep,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  trackLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pointStart: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointMid: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  midCount: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  pointEnd: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointLive: {
    backgroundColor: Colors.primaryLight,
  },
  pointLabel: {
    color: Colors.forestDeep,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  connectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.primaryDark,
    marginHorizontal: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.forestBorder,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.forestBorder,
  },
  tableTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 6,
  },
  tableScroll: {
    maxHeight: 110,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.forestBorder,
  },
  rowSeq: {
    fontSize: 10,
    color: Colors.textMuted,
    width: 30,
  },
  rowCoords: {
    fontSize: 10,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    flex: 1,
  },
  rowSpeed: {
    fontSize: 10,
    color: Colors.primaryLight,
    width: 60,
    textAlign: 'right',
  },
  rowTime: {
    fontSize: 10,
    color: Colors.textMuted,
    width: 65,
    textAlign: 'right',
  },
});

