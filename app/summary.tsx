import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { generateSummary } from '../lib/summary';
import { saveRecord, generateId, saveDraft } from '../lib/storage';
import { getCategoryById, preambleQuestions } from '../lib/questions';
import { createInterview } from '../lib/engine';
import { exportPdf } from '../lib/pdf';

export default function SummaryScreen() {
  const router = useRouter();
  const { categoryId, answers: answersJson } = useLocalSearchParams<{
    categoryId: string;
    answers: string;
  }>();

  const answers = JSON.parse(answersJson || '{}') as Record<string, string>;
  const summary = generateSummary(categoryId!, answers);
  const category = getCategoryById(categoryId!);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const autoSave = async () => {
      try {
        const record = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          category: categoryId!,
          categoryLabel: category?.label || '',
          patientName: answers['patient_name'] || '',
          companionName: answers['companion_name'] || '',
          relationship: answers['relationship'] || '',
          summary,
          answers,
        };
        await saveRecord(record);
        setSaved(true);
      } catch {
        // manual save still available as fallback
      }
    };
    autoSave();
  }, []);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(summary);
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not copy to clipboard.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: summary,
        title: 'Companion Observation Record',
      });
    } catch {
      // user cancelled — not an error
    }
  };


  const handlePdf = async () => {
    try {
      await exportPdf(summary);
    } catch {
      Alert.alert('Error', 'Could not create PDF. Try using Copy or Share instead.');
    }
  };

  const handleEdit = async () => {
    const interview = createInterview(categoryId!);
    const answeredIds = interview.questionOrder.filter(id => answers[id] != null);
    const lastAnsweredId = answeredIds[answeredIds.length - 1];
    const lastIndex = lastAnsweredId
      ? interview.questionOrder.indexOf(lastAnsweredId)
      : 0;
    const history = Array.from({ length: lastIndex }, (_, i) => i);
    const editState = {
      ...interview,
      answers,
      currentQuestionIndex: lastIndex,
      history,
    };
    await saveDraft(editState);
    router.replace({
      pathname: '/interview',
      params: { categoryId: categoryId!, draft: JSON.stringify(editState) },
    });
  };

  const handleDone = () => {
    router.dismissAll();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Record</Text>
        <Text style={styles.headerSubtitle}>
          Show this to the triage nurse or provider.{saved ? ' Automatically saved to your device.' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.summaryScroll}
        contentContainerStyle={styles.summaryContent}
      >
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={handleCopy}
            accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy record to clipboard'}
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>
              {copied ? '✓ Copied' : 'Copy'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={handleShare}
            accessibilityLabel="Share record as text"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>Share</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={handlePdf}
            accessibilityLabel="Export record as PDF"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>PDF</Text>
          </Pressable>

        </View>

        <Pressable
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          onPress={handleEdit}
          accessibilityLabel="Go back and edit your answers"
          accessibilityRole="button"
        >
          <Text style={styles.editButtonText}>Edit Answers</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
          onPress={handleDone}
          accessibilityLabel="Done, return to home screen"
          accessibilityRole="button"
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  summaryScroll: {
    flex: 1,
  },
  summaryContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  summaryBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonSaved: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  actionButtonSavedText: {
    color: colors.white,
  },
  editButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  doneButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
