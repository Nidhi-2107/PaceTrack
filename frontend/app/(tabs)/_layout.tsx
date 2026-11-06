import React from 'react';
import { Tabs } from 'expo-router';
import { Text, Platform, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.forestDeep,
          borderBottomColor: Colors.forestBorder,
          borderBottomWidth: 1,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '800',
          letterSpacing: 0.5,
        },
        tabBarStyle: {
          backgroundColor: Colors.forestDeep,
          borderTopColor: Colors.forestBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>⚡</Text>,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'GPS Tracker',
          tabBarLabel: 'Track',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>📍</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Activities',
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>📈</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile & Goals',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>👤</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 18,
  },
});

