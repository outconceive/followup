import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { loadDraft, clearDraft } from '../lib/storage';
import { getCategoryById } from '../lib/questions';
import { OfflineBanner } from '../components/OfflineBanner';

export default function HomeScreen() {
  const router = useRouter();
  const [draftCategory, setDraftCategory] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDraft().then(draft => {
        if (draft) {
          const cat = getCategoryById(draft.categoryId);
          setDraftCategory(cat?.label || null);
        } else {
          setDraftCategory(null);
        }
      });
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>Followup</Text>
          <Text style={styles.subtitle}>Your waiting room advocate</Text>
        </View>

        <View style={styles.middle}>
          <Text style={styles.tagline}>
            The provider will ask one question.{'\n'}
            We'll help you answer the ones they didn't.
          </Text>

          <View style={styles.explainer}>
            <Text style={styles.explainerText}>
              You're probably going to wait a while before anyone comes in.
            </Text>
            <Text style={styles.explainerText}>
              The provider will have a few minutes with you. You have more time than that right now.
            </Text>
            <Text style={styles.explainerText}>
              Tell us what happened. We'll help you figure out what matters — and make sure you can say it clearly when it counts.
            </Text>
          </View>
        </View>

        <View style={styles.buttons}>
          {draftCategory && (
            <Pressable
              style={({ pressed }) => [styles.resumeButton, pressed && styles.pressed]}
              onPress={() => router.push('/resume')}
              accessibilityLabel={`Resume your in-progress record for: ${draftCategory}`}
              accessibilityRole="button"
            >
              <Text style={styles.resumeButtonText}>Resume In-Progress</Text>
              <Text style={styles.resumeDetail}>{draftCategory}</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => {
              if (draftCategory) clearDraft();
              router.push('/select');
            }}
            accessibilityLabel="Start a new record"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Start New Record</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={() => router.push('/saved')}
            accessibilityLabel="View saved records"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Saved Records</Text>
          </Pressable>
        </View>

        <OfflineBanner />

        <Text style={styles.privacy}>
          Your records never leave your phone. No accounts. No data collected.
        </Text>
        <Text style={styles.disclaimer}>
          Followup helps you organize what you've observed. It is not medical
          advice. If this is a life-threatening emergency, alert staff or call 911.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.accent,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  tagline: {
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  explainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  explainerText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  buttons: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  resumeButton: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  resumeButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.accent,
  },
  resumeDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  privacy: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});
