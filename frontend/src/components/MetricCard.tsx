import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  unit,
  subValue,
  accentColor = Colors.primary,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}18` }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {subValue && <Text style={styles.subValue}>{subValue}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.forestBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  subValue: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
