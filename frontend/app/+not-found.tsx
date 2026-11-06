import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../src/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to PaceTrack Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  link: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
});
