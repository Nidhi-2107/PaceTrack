import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import { Config } from '../constants/config';
import { SystemHealthState } from '../types/health';

interface Props {
  state: SystemHealthState;
  onRefresh: () => void;
}

export function HealthCard({ state, onRefresh }: Props) {
  const isHealthy = state.connected && state.data?.status === 'UP';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: state.loading
                  ? Colors.warning
                  : isHealthy
                  ? Colors.success
                  : Colors.error,
              },
            ]}
          />
          <Text style={styles.cardTitle}>Backend Health Status</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={state.loading}
          activeOpacity={0.7}
        >
          {state.loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.refreshButtonText}>Ping Endpoint</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Target API URL:</Text>
        <Text style={styles.metaValue} numberOfLines={1}>
          {Config.apiBaseUrl}/health
        </Text>
      </View>

      {state.data && (
        <>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Service:</Text>
            <Text style={styles.metaValueHighlight}>{state.data.service}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Environment:</Text>
            <Text style={styles.metaValue}>{state.data.environment}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Version:</Text>
            <Text style={styles.metaValue}>{state.data.version}</Text>
          </View>
          {state.data.details?.uptimeMs !== undefined && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Backend Uptime:</Text>
              <Text style={styles.metaValue}>
                {Math.round((state.data.details.uptimeMs as number) / 1000)}s
              </Text>
            </View>
          )}
        </>
      )}

      {state.error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connection Offline</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
          <Text style={styles.errorHint}>
            Start the Spring Boot backend with: cd backend && mvn spring-boot:run
          </Text>
        </View>
      )}

      {state.lastChecked && (
        <Text style={styles.timestamp}>
          Last checked: {state.lastChecked.toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  metaValueHighlight: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 8,
  },
  errorTitle: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  errorMessage: {
    color: Colors.textPrimary,
    fontSize: 12,
  },
  errorHint: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
  timestamp: {
    marginTop: 12,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});

