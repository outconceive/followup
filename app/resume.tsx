import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '../constants/theme';
import { loadDraft } from '../lib/storage';

export default function ResumeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDraft().then(draft => {
      if (draft) {
        router.replace({
          pathname: '/interview',
          params: { categoryId: draft.categoryId, draft: JSON.stringify(draft) },
        });
      } else {
        router.replace('/select');
      }
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.text}>Resuming...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
