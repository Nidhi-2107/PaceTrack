import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/colors';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
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
            name="(auth)/login"
            options={{
              title: 'Sign In',
              headerBackTitle: 'Home',
            }}
          />
          <Stack.Screen
            name="(auth)/register"
            options={{
              title: 'Create Account',
              headerBackTitle: 'Home',
            }}
          />
          <Stack.Screen
            name="+not-found"
            options={{
              title: 'Not Found',
            }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
