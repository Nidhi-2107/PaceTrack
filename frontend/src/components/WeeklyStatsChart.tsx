import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyStepRecord } from '../types/activity';
import { Colors } from '../constants/colors';

interface WeeklyStatsChartProps {
  dailySteps: DailyStepRecord[];
  targetSteps?: number;
}

export const WeeklyStatsChart: React.FC<WeeklyStatsChartProps> = ({
  dailySteps,
  targetSteps = 10000,
}) => {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Map 7 days of the current week
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  // Find step count for each day by matching date
  const chartData = dayNames.map((name, index) => {
    // Estimate date of that day in current week
    const diff = index - currentDayIndex;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    const dateStr = targetDate.toISOString().split('T')[0];

    const match = dailySteps.find((d) => d.recordDate === dateStr);
    const steps = match ? match.stepCount : 0;
    const isToday = index === currentDayIndex;

    return {
      name,
      steps,
      isToday,
    };
  });

  const maxSteps = Math.max(targetSteps, ...chartData.map((d) => d.steps));
  const chartHeight = 110;

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {chartData.map((item, idx) => {
          const heightPercent = maxSteps > 0 ? (item.steps / maxSteps) * chartHeight : 4;
          const barHeight = Math.max(heightPercent, 6);
          const isGoalMet = item.steps >= targetSteps;

          return (
            <View key={idx} style={styles.barColumn}>
              <View style={[styles.barBackground, { height: chartHeight }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barHeight,
                      backgroundColor: item.isToday
                        ? Colors.primaryLight
                        : isGoalMet
                        ? Colors.primary
                        : Colors.surfaceBorder,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, item.isToday && styles.dayLabelToday]}>
                {item.name}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primaryLight }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Goal Met ({targetSteps.toLocaleString()})</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
    marginVertical: 10,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 14,
    backgroundColor: Colors.forestDeep,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  dayLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 6,
  },
  dayLabelToday: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.forestBorder,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
