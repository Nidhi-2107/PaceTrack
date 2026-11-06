import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'PaceTrack',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="+not-found"
          options={{
            title: 'Not Found',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
