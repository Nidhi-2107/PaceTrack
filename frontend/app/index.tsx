import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Header } from '../src/components/Header';
import { HealthCard } from '../src/components/HealthCard';
import { FeatureCard } from '../src/components/FeatureCard';
import { Colors } from '../src/constants/colors';
import { fetchBackendHealth } from '../src/services/api/healthApi';
import { SystemHealthState } from '../src/types/health';
import { useAuth } from '../src/context/AuthContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

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

  // If user is already authenticated, jump straight to the full fitness dashboard
  if (!authLoading && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header />

        <View style={styles.container}>
          {/* Welcome Card & Action */}
          <View style={styles.welcomeCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PHASE 3 ACTIVE • GPS & PEDOMETER TRACKING</Text>
            </View>

            <Text style={styles.welcomeTitle}>Move More. Track Better. Compete Together.</Text>
            <Text style={styles.welcomeSubtitle}>
              Experience real-time GPS tracking, cadence estimation, daily step rings, and weekly analytics in a deep forest green interface.
            </Text>

            {authLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Checking session status...</Text>
              </View>
            ) : (
              <View style={styles.authActionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={() => router.push('/(auth)/login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.secondaryBtn]}
                  onPress={() => router.push('/(auth)/register')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryBtnText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.guestLink}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.guestLinkText}>Explore Dashboard as Guest →</Text>
            </TouchableOpacity>
          </View>

          {/* Backend Integration Section */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Cloud Engine Health</Text>
          <HealthCard state={healthState} onRefresh={checkHealth} />

          {/* Architecture Roadmap Section */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
            Platform Capabilities
          </Text>

          <FeatureCard
            iconText="⚡"
            title="Real-Time GPS Tracking & Pace"
            description="Foreground location updates, Haversine distance, elapsed stopwatch, and speed calculation."
            status="Ready"
          />

          <FeatureCard
            iconText="👟"
            title="Hardware Pedometer Integration"
            description="Automatic step sensor discovery via expo-sensors, daily progress ring, and offline-safe sync."
            status="Ready"
          />

          <FeatureCard
            iconText="📊"
            title="Weekly Analytics & Activity History"
            description="Distance, duration, calorie burn charts, route waypoints, and user daily step goals."
            status="Ready"
          />

          <FeatureCard
            iconText="🔐"
            title="Secure JWT Cloud Synchronization"
            description="Modular monolith Spring Boot 3 + PostgreSQL backend with multi-tenant data isolation."
            status="Ready"
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
  welcomeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: Colors.mintBadgeBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  badgeText: {
    color: Colors.primaryLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 10,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  authActionsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  primaryBtnText: {
    color: Colors.forestDeep,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: Colors.forestCard,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  secondaryBtnText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  guestLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  guestLinkText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
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
    borderTopColor: Colors.forestBorder,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
