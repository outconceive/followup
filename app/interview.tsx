import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  InteractionManager,
  AccessibilityInfo,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { VoiceInput } from '../components/VoiceInput';
import {
  createInterview,
  getCurrentQuestion,
  answerQuestion,
  goBack,
  isComplete,
  getProgress,
  getSectionLabel,
} from '../lib/engine';
import { saveDraft, clearDraft } from '../lib/storage';
import { InterviewState } from '../lib/types';

export default function InterviewScreen() {
  const router = useRouter();
  const { categoryId, draft: draftJson } = useLocalSearchParams<{
    categoryId: string;
    draft?: string;
  }>();
  const [state, setState] = useState<InterviewState>(() => {
    if (draftJson) {
      try {
        return JSON.parse(draftJson);
      } catch {}
    }
    return createInterview(categoryId!);
  });
  const [inputValue, setInputValue] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(new Set());
  const [urgentAlert, setUrgentAlert] = useState<{ message: string; answer: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  const question = getCurrentQuestion(state);
  const progress = getProgress(state);
  const section = getSectionLabel(state);

  useEffect(() => {
    if (isComplete(state)) {
      clearDraft();
      router.replace({
        pathname: '/summary',
        params: {
          categoryId: state.categoryId,
          answers: JSON.stringify(state.answers),
        },
      });
    }
  }, [state]);

  useEffect(() => {
    if (!isComplete(state)) {
      saveDraft(state);
    }
  }, [state.currentQuestionIndex, state.answers]);

  useEffect(() => {
    const existingAnswer = question ? state.answers[question.id] : undefined;
    setInputValue(
      existingAnswer && existingAnswer !== 'Skipped' ? existingAnswer : ''
    );
    setSelectedChoice(null);
    setSelectedMulti(new Set());
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    if (question?.answerType === 'freetext') {
      InteractionManager.runAfterInteractions(() => {
        inputRef.current?.focus();
      });
    }

    if (question) {
      const progressPct = Math.round(progress * 100);
      AccessibilityInfo.announceForAccessibility(
        `Question: ${question.text}. Progress: ${progressPct} percent.`
      );
    }
  }, [state.currentQuestionIndex]);

  if (!question) return null;

  const canSubmit = inputValue.trim().length > 0;

  const advance = (answer: string) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setState(prev => answerQuestion(prev, answer));
    });
  };

  const handleSubmit = (value?: string) => {
    const answer = value || inputValue.trim();
    if (!answer && !question.skippable) return;
    const finalAnswer = answer || 'Skipped';

    const alert = question.urgentAlert;
    if (alert) {
      const matches =
        question.answerType === 'multichoice'
          ? alert.on.some(o => finalAnswer.includes(o))
          : alert.on.includes(finalAnswer);
      if (matches) {
        setUrgentAlert({ message: alert.message, answer: finalAnswer });
        AccessibilityInfo.announceForAccessibility(
          `Important: ${alert.message}`
        );
        return;
      }
    }

    advance(finalAnswer);
  };

  const handleAlertContinue = () => {
    if (!urgentAlert) return;
    const answer = urgentAlert.answer;
    setUrgentAlert(null);
    advance(answer);
  };

  const handleChoice = (choice: string) => {
    setSelectedChoice(choice);
    setTimeout(() => handleSubmit(choice), 200);
  };

  const handleYesNo = (answer: string) => {
    setSelectedChoice(answer);
    setTimeout(() => handleSubmit(answer), 200);
  };

  const handleBack = () => {
    if ((state.history || []).length === 0) {
      router.back();
    } else {
      setState(prev => goBack(prev));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            accessibilityLabel="Go back to previous question"
            accessibilityRole="button"
          >
            <Text style={styles.backButton}>← Back</Text>
          </Pressable>
          <View
            style={styles.progressBarContainer}
            accessibilityLabel={`Progress: ${Math.round(progress * 100)} percent`}
            accessibilityRole="progressbar"
          >
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {section && (
          <Text style={styles.sectionLabel} accessibilityRole="header">
            {section}
          </Text>
        )}

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.questionArea, { opacity: fadeAnim }]}>
            <Text
              style={styles.questionText}
              accessibilityRole="text"
            >
              {question.text}
            </Text>

            {question.answerType === 'freetext' && (
              <View style={styles.inputArea}>
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={question.placeholder || 'Type or tap the mic to speak...'}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit
                  accessibilityLabel={question.placeholder || 'Type your answer or use voice input'}
                  accessibilityHint="Enter your response to continue, or use the microphone button to speak"
                />
                <View style={styles.inputButtons}>
                  <VoiceInput
                    onTranscript={(text) =>
                      setInputValue(prev => prev ? `${prev} ${text}` : text)
                    }
                  />
                  {question.skippable && (
                    <Pressable
                      style={styles.skipButton}
                      onPress={() => handleSubmit('Skipped')}
                      accessibilityLabel="Skip this question"
                      accessibilityRole="button"
                    >
                      <Text style={styles.skipButtonText}>Skip</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[
                      styles.nextButton,
                      !canSubmit && !question.skippable && styles.nextButtonDisabled,
                    ]}
                    onPress={() => handleSubmit()}
                    disabled={!canSubmit && !question.skippable}
                    accessibilityLabel="Go to next question"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSubmit && !question.skippable }}
                  >
                    <Text style={styles.nextButtonText}>Next →</Text>
                  </Pressable>
                </View>
              </View>
            )}



            {question.answerType === 'yesno' && (
              <View style={styles.yesNoArea}>
                <Pressable
                  style={[
                    styles.yesNoButton,
                    selectedChoice === 'Yes' && styles.choiceSelected,
                  ]}
                  onPress={() => handleYesNo('Yes')}
                  accessibilityLabel="Yes"
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedChoice === 'Yes' }}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      selectedChoice === 'Yes' && styles.choiceSelectedText,
                    ]}
                  >
                    Yes
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.yesNoButton,
                    selectedChoice === 'No' && styles.choiceSelected,
                  ]}
                  onPress={() => handleYesNo('No')}
                  accessibilityLabel="No"
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedChoice === 'No' }}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      selectedChoice === 'No' && styles.choiceSelectedText,
                    ]}
                  >
                    No
                  </Text>
                </Pressable>
              </View>
            )}

            {question.answerType === 'choice' && question.choices && (
              <View style={styles.choicesArea}>
                {question.choices.map((choice) => (
                  <Pressable
                    key={choice}
                    style={[
                      styles.choiceButton,
                      selectedChoice === choice && styles.choiceSelected,
                    ]}
                    onPress={() => handleChoice(choice)}
                    accessibilityLabel={choice}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedChoice === choice }}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        selectedChoice === choice && styles.choiceSelectedText,
                      ]}
                    >
                      {choice}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {question.answerType === 'multichoice' && question.choices && (
              <View style={styles.choicesArea}>
                {question.choices.map((choice) => (
                  <Pressable
                    key={choice}
                    style={[
                      styles.choiceButton,
                      selectedMulti.has(choice) && styles.choiceSelected,
                    ]}
                    onPress={() => {
                      setSelectedMulti(prev => {
                        const next = new Set(prev);
                        if (next.has(choice)) next.delete(choice);
                        else next.add(choice);
                        return next;
                      });
                    }}
                    accessibilityLabel={choice}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selectedMulti.has(choice) }}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        selectedMulti.has(choice) && styles.choiceSelectedText,
                      ]}
                    >
                      {selectedMulti.has(choice) ? '✓ ' : ''}{choice}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[
                    styles.nextButton,
                    selectedMulti.size === 0 && styles.nextButtonDisabled,
                  ]}
                  onPress={() => handleSubmit(Array.from(selectedMulti).join(', '))}
                  disabled={selectedMulti.size === 0}
                  accessibilityLabel="Continue with selected options"
                  accessibilityRole="button"
                >
                  <Text style={styles.nextButtonText}>Next →</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {urgentAlert && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertTitle} accessibilityRole="header">
              Tell the staff now
            </Text>
            <Text style={styles.alertMessage}>{urgentAlert.message}</Text>
            <Pressable
              style={styles.alertButton}
              onPress={handleAlertContinue}
              accessibilityLabel="I understand, continue the interview"
              accessibilityRole="button"
            >
              <Text style={styles.alertButtonText}>I understand — continue</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 10,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.error,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  alertIcon: {
    fontSize: 40,
  },
  alertTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  alertButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  alertButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  backButton: {
    fontSize: fontSize.md,
    color: colors.accent,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  questionArea: {
    flex: 1,
    gap: spacing.xl,
  },
  questionText: {
    fontSize: fontSize.lg,
    color: colors.text,
    lineHeight: 32,
    fontWeight: '600',
  },
  inputArea: {
    gap: spacing.md,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    lineHeight: 24,
  },
  inputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.background,
  },
  skipButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  yesNoArea: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  yesNoButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  yesNoText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  choicesArea: {
    gap: spacing.sm,
  },
  choiceButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  choiceText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  choiceSelectedText: {
    color: colors.background,
    fontWeight: '600',
  },
});
