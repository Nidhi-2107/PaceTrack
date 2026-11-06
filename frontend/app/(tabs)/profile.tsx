import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { HealthCard } from '../../src/components/HealthCard';
import { fetchBackendHealth } from '../../src/services/api/healthApi';
import { fetchGoalsApi, createOrUpdateGoalApi } from '../../src/services/api/goalsApi';
import { SystemHealthState } from '../../src/types/health';
import { Goal } from '../../src/types/activity';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, logout, isAuthenticated } = useAuth();

  const [targetStepsInput, setTargetStepsInput] = useState<string>('10000');
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [isSavingGoal, setIsSavingGoal] = useState<boolean>(false);
  const [goalFeedback, setGoalFeedback] = useState<string | null>(null);

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
      const message = err instanceof Error ? err.message : 'Backend unreachable';
      setHealthState({
        loading: false,
        connected: false,
        data: null,
        error: message,
        lastChecked: new Date(),
      });
    }
  }, []);

  const loadGoals = useCallback(async () => {
    if (!token) return;
    try {
      const goals = await fetchGoalsApi(token);
      const stepGoal = goals.find((g) => g.goalType === 'DAILY_STEPS');
      if (stepGoal) {
        setCurrentGoal(stepGoal);
        setTargetStepsInput(stepGoal.targetValue.toString());
      }
    } catch (err) {
      console.warn('Goals fetch error:', err);
    }
  }, [token]);

  useEffect(() => {
    checkHealth();
    loadGoals();
  }, [checkHealth, loadGoals]);

  const handleSaveGoal = async () => {
    const val = parseInt(targetStepsInput.trim(), 10);
    if (isNaN(val) || val < 1000 || val > 100000) {
      Alert.alert('Invalid Goal', 'Please enter a target between 1,000 and 100,000 steps.');
      return;
    }

    if (!token) return;
    setIsSavingGoal(true);
    setGoalFeedback(null);

    try {
      const saved = await createOrUpdateGoalApi(token, {
        goalType: 'DAILY_STEPS',
        targetValue: val,
      });
      setCurrentGoal(saved);
      setGoalFeedback('Daily step goal updated!');
      setTimeout(() => setGoalFeedback(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update goal';
      Alert.alert('Goal Error', msg);
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.firstName[0]}
                {user.lastName[0]}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>Guest Mode</Text>
            <TouchableOpacity
              style={styles.signInPromptBtn}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.signInPromptText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Fitness Goals Section */}
        <Text style={styles.sectionTitle}>Daily Step Goal</Text>
        <View style={styles.goalCard}>
          <Text style={styles.goalDescription}>
            Set your target step count for each day. Your progress ring will adapt to this goal.
          </Text>

          <View style={styles.goalInputRow}>
            <TextInput
              style={styles.goalInput}
              keyboardType="number-pad"
              value={targetStepsInput}
              onChangeText={setTargetStepsInput}
              placeholder="e.g. 10000"
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity
              style={styles.saveGoalBtn}
              onPress={handleSaveGoal}
              disabled={isSavingGoal}
              activeOpacity={0.8}
            >
              {isSavingGoal ? (
                <ActivityIndicator size="small" color={Colors.forestDeep} />
              ) : (
                <Text style={styles.saveGoalText}>Update Goal</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick preset buttons */}
          <View style={styles.presetsRow}>
            {[6000, 8000, 10000, 12000, 15000].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetBtn,
                  targetStepsInput === preset.toString() && styles.presetBtnActive,
                ]}
                onPress={() => setTargetStepsInput(preset.toString())}
              >
                <Text
                  style={[
                    styles.presetText,
                    targetStepsInput === preset.toString() && styles.presetTextActive,
                  ]}
                >
                  {(preset / 1000).toFixed(0)}k
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {goalFeedback && (
            <Text style={styles.goalFeedbackText}>✓ {goalFeedback}</Text>
          )}
        </View>

        {/* System & Health Status */}
        <Text style={styles.sectionTitle}>Backend Connection</Text>
        <HealthCard state={healthState} onRefresh={checkHealth} />

        {/* Account Actions */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Sign Out of PaceTrack</Text>
          </TouchableOpacity>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: Colors.forestDeep,
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.mintBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  roleText: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  signInPromptBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  signInPromptText: {
    color: Colors.forestDeep,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginBottom: 14,
  },
  goalDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  goalInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goalInput: {
    flex: 1,
    backgroundColor: Colors.forestDeep,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  saveGoalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveGoalText: {
    color: Colors.forestDeep,
    fontSize: 13,
    fontWeight: '800',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  presetBtn: {
    backgroundColor: Colors.forestDeep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  presetBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.mintBadgeBg,
  },
  presetText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  presetTextActive: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  goalFeedbackText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
});
