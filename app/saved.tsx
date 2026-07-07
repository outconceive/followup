import { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { getRecords, deleteRecord, saveDraft } from '../lib/storage';
import { SavedRecord } from '../lib/types';
import { exportPdf } from '../lib/pdf';
import { createInterview } from '../lib/engine';

export default function SavedScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getRecords().then(setRecords);
    }, [])
  );

  const handleCopy = async (record: SavedRecord) => {
    await Clipboard.setStringAsync(record.summary);
    setCopiedId(record.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (record: SavedRecord) => {
    await Share.share({
      message: record.summary,
      title: 'Companion Observation Record',
    });
  };

  const handleEdit = async (record: SavedRecord) => {
    const interview = createInterview(record.category);
    const answeredIds = interview.questionOrder.filter(id => record.answers[id] != null);
    const lastAnsweredId = answeredIds[answeredIds.length - 1];
    const lastIndex = lastAnsweredId
      ? interview.questionOrder.indexOf(lastAnsweredId)
      : 0;
    const history = Array.from({ length: lastIndex }, (_, i) => i);
    const editState = {
      ...interview,
      answers: record.answers,
      currentQuestionIndex: lastIndex,
      history,
    };
    await saveDraft(editState);
    await deleteRecord(record.id);
    router.push({
      pathname: '/interview',
      params: { categoryId: record.category, draft: JSON.stringify(editState) },
    });
  };

  const handleDelete = (record: SavedRecord) => {
    Alert.alert(
      'Delete Record',
      'This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRecord(record.id);
            setRecords(prev => prev.filter(r => r.id !== record.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Saved Records</Text>
      </View>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No saved records yet.</Text>
          <Text style={styles.emptySubtext}>
            Records you save will appear here so you can access them later.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {records.map((record) => (
            <View key={record.id} style={styles.card}>
              <Pressable
                style={styles.cardHeader}
                onPress={() =>
                  setExpandedId(expandedId === record.id ? null : record.id)
                }
              >
                <View style={styles.cardInfo}>
                  <Text style={styles.cardPatient}>
                    {record.patientName || 'Patient'}
                  </Text>
                  <Text style={styles.cardCategory}>
                    {record.categoryLabel}
                  </Text>
                  <Text style={styles.cardDate}>
                    {formatDate(record.timestamp)}
                  </Text>
                </View>
                <Text style={styles.chevron}>
                  {expandedId === record.id ? '▼' : '▶'}
                </Text>
              </Pressable>

              {expandedId === record.id && (
                <View style={styles.cardBody}>
                  <ScrollView
                    style={styles.summaryScroll}
                    nestedScrollEnabled
                  >
                    <Text style={styles.summaryText}>{record.summary}</Text>
                  </ScrollView>

                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.cardAction}
                      onPress={() => handleEdit(record)}
                    >
                      <Text style={styles.cardActionText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={styles.cardAction}
                      onPress={() => handleCopy(record)}
                    >
                      <Text style={styles.cardActionText}>
                        {copiedId === record.id ? '✓ Copied' : 'Copy'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.cardAction}
                      onPress={() => handleShare(record)}
                    >
                      <Text style={styles.cardActionText}>Share</Text>
                    </Pressable>
                    <Pressable
                      style={styles.cardAction}
                      onPress={() => exportPdf(record.summary)}
                    >
                      <Text style={styles.cardActionText}>PDF</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.cardAction, { borderRightWidth: 0 }]}
                      onPress={() => handleDelete(record)}
                    >
                      <Text style={[styles.cardActionText, styles.deleteText]}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
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
    paddingBottom: spacing.lg,
  },
  backButton: {
    fontSize: fontSize.md,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardInfo: {
    flex: 1,
  },
  cardPatient: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  cardCategory: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  chevron: {
    fontSize: 14,
    color: colors.textMuted,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryScroll: {
    maxHeight: 300,
    padding: spacing.lg,
  },
  summaryText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardAction: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  cardActionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
  },
  deleteText: {
    color: colors.error,
  },
});
