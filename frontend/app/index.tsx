import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Header } from '../src/components/Header';
import { HealthCard } from '../src/components/HealthCard';
import { FeatureCard } from '../src/components/FeatureCard';
import { Colors } from '../src/constants/colors';
import { fetchBackendHealth } from '../src/services/api/healthApi';
import { SystemHealthState } from '../src/types/health';

export default function IndexScreen() {
  const [healthState, setHealthState] = useState<SystemHealthState>({
    loading: true,
    connected: false,
    data: null,
    error: null,
    lastChecked: null,
  });

  const checkHealth = useCallback(async () => {
    setHealthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchBackendHealth();
      setHealthState({
        loading: false,
        connected: true,
        data,
        error: null,
        lastChecked: new Date(),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to reach PaceTrack backend API';
      setHealthState({
        loading: false,
        connected: false,
        data: null,
        error: message,
        lastChecked: new Date(),
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header />

        <View style={styles.container}>
          <Text style={styles.sectionTitle}>System Integration</Text>
          <HealthCard state={healthState} onRefresh={checkHealth} />

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
            Platform Architecture & Roadmap
          </Text>

          <FeatureCard
            iconText="⚡"
            title="Clean Architecture & Modular Monolith"
            description="Spring Boot 3 + Java 24 + PostgreSQL with strict separation of controllers, services, repositories, and DTOs."
            status="Ready"
          />

          <FeatureCard
            iconText="📱"
            title="Cross-Platform React Native + Expo"
            description="Single codebase powering Android APK and Web deployment with responsive styling and Expo Router navigation."
            status="Ready"
          />

          <FeatureCard
            iconText="🔐"
            title="JWT Authentication & Registration"
            description="Stateless token authentication, password encryption via BCrypt, and secure user profile storage."
            status="Planned"
          />

          <FeatureCard
            iconText="📍"
            title="GPS Activity Tracker & Offline Sync"
            description="Background GPS location recording, distance, pace, calories estimation, and offline SQLite-to-Postgres sync queue."
            status="Planned"
          />

          <FeatureCard
            iconText="🏆"
            title="Streaks, Challenges & Social Feed"
            description="Daily/weekly goals, leaderboards, friendship activities, and streak tracking with privacy-first location masking."
            status="Planned"
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Platform: {Platform.OS.toUpperCase()} • PaceTrack Engine v1.0.0
            </Text>
          </View>
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
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
