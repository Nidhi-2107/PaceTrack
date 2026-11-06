import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Config } from '../constants/config';

export function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>PHASE 1 • INITIALIZED</Text>
      </View>
      <Text style={styles.title}>{Config.appName}</Text>
      <Text style={styles.tagline}>{Config.tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  badge: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: Colors.primary,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
