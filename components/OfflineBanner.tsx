import { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, Animated, AppState, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';

async function checkConnectivity(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return navigator.onLine;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkConnectivity().then(online => setIsOffline(!online));

    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkConnectivity().then(online => setIsOffline(!online));
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[styles.banner, { opacity }]}
      accessibilityRole="alert"
      accessibilityLabel="You are offline. This app works without internet."
    >
      <Text style={styles.bannerText}>
        No internet — that's fine. Everything works offline.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
