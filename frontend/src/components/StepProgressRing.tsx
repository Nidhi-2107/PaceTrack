import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface StepProgressRingProps {
  currentSteps: number;
  goalSteps: number;
  caloriesBurned?: number;
  distanceKm?: number;
  size?: number;
}

export const StepProgressRing: React.FC<StepProgressRingProps> = ({
  currentSteps,
  goalSteps,
  caloriesBurned = 0,
  distanceKm = 0,
  size = 220,
}) => {
  const safeGoal = goalSteps > 0 ? goalSteps : 10000;
  const progressPercent = Math.min(Math.round((currentSteps / safeGoal) * 100), 100);
  const ringWidth = 14;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: ringWidth,
          },
        ]}
      >
        {/* Glow indicator line at top */}
        <View
          style={[
            styles.innerRing,
            {
              width: size - ringWidth * 2 - 4,
              height: size - ringWidth * 2 - 4,
              borderRadius: (size - ringWidth * 2 - 4) / 2,
            },
          ]}
        >
          <Text style={styles.stepCount}>{currentSteps.toLocaleString()}</Text>
          <Text style={styles.stepLabel}>STEPS TODAY</Text>
          <View style={styles.goalBadge}>
            <Text style={styles.goalText}>
              {progressPercent}% of {safeGoal.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statMini}>
              <Text style={styles.statMiniValue}>{distanceKm.toFixed(2)}</Text>
              <Text style={styles.statMiniLabel}>km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statMini}>
              <Text style={styles.statMiniValue}>{caloriesBurned}</Text>
              <Text style={styles.statMiniLabel}>kcal</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  outerRing: {
    borderColor: Colors.forestBorder,
    borderTopColor: Colors.primary,
    borderRightColor: Colors.primaryLight,
    borderBottomColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.forestCard,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  innerRing: {
    backgroundColor: Colors.forestDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  stepCount: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  goalBadge: {
    backgroundColor: Colors.mintBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  goalText: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    width: '80%',
    justifyContent: 'space-around',
  },
  statMini: {
    alignItems: 'center',
  },
  statMiniValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  statMiniLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.surfaceBorder,
  },
});
