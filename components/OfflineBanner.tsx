import { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import * as Network from 'expo-network';
import { colors, spacing, borderRadius } from '../constants/theme';

// Reads connectivity from the OS — the app itself makes no network requests.
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    Network.getNetworkStateAsync()
      .then(state => {
        if (mounted) setIsOffline(!(state.isConnected ?? true));
      })
      .catch(() => {});

    const sub = Network.addNetworkStateListener(state => {
      setIsOffline(!(state.isConnected ?? true));
    });

    return () => {
      mounted = false;
      sub.remove();
    };
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
