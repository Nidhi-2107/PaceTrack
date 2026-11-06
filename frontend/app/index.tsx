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
import { useRouter } from 'expo-router';
import { Header } from '../src/components/Header';
import { HealthCard } from '../src/components/HealthCard';
import { FeatureCard } from '../src/components/FeatureCard';
import { Colors } from '../src/constants/colors';
import { fetchBackendHealth } from '../src/services/api/healthApi';
import { SystemHealthState } from '../src/types/health';
import { useAuth } from '../src/context/AuthContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();

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
          {/* User Authentication Status Section */}
          <Text style={styles.sectionTitle}>User Session</Text>
          <View style={styles.authCard}>
            {authLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Checking session status...</Text>
              </View>
            ) : isAuthenticated && user ? (
              <View>
                <View style={styles.userHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{user.role}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>User ID:</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>
                    {user.id}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Registered:</Text>
                  <Text style={styles.metaValue}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={logout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.logoutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.guestContainer}>
                <Text style={styles.guestTitle}>Not Signed In</Text>
                <Text style={styles.guestSubtitle}>
                  Sign in or create a new account to unlock step tracking, route history, and fitness challenges.
                </Text>

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
                    <Text style={styles.secondaryBtnText}>Register</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Backend Integration Section */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>System Integration</Text>
          <HealthCard state={healthState} onRefresh={checkHealth} />

          {/* Architecture Roadmap Section */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
            Platform Architecture & Roadmap
          </Text>

          <FeatureCard
            iconText="🔐"
            title="User Registration & Login (Phase 2)"
            description="JWT access tokens, BCrypt password hashing, Spring Security filter chain, and GET /api/v1/users/me."
            status="Ready"
          />

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
            iconText="📍"
            title="GPS Activity Tracker & Offline Sync"
            description="Background GPS location recording, distance, pace, calories estimation, and offline sync queue."
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
  authCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 10,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: Colors.primary,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  roleBadgeText: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
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
    maxWidth: '65%',
  },
  logoutButton: {
    marginTop: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: Colors.error,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
  guestContainer: {
    paddingVertical: 4,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  guestSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  authActionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  secondaryBtnText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
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
