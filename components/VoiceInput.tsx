import { useState, useEffect, useCallback } from 'react';
import { Pressable, Text, StyleSheet, Animated, View } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

type Props = {
  onTranscript: (text: string) => void;
};

export function VoiceInput({ onTranscript }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    try {
      const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (typeof available === 'boolean') {
        setIsAvailable(available);
      } else if (available && typeof (available as any).then === 'function') {
        (available as any).then(setIsAvailable);
      }
    } catch {
      setIsAvailable(false);
    }
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      onTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  });

  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isListening]);

  const handlePress = useCallback(async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
    });
    setIsListening(true);
  }, [isListening]);

  if (!isAvailable) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          style={[styles.button, isListening && styles.buttonActive]}
          onPress={handlePress}
          accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
          accessibilityRole="button"
          accessibilityState={{ selected: isListening }}
        >
          <Text style={styles.buttonIcon}>{isListening ? '■' : '🎤'}</Text>
        </Pressable>
      </Animated.View>
      {isListening && (
        <Text style={styles.listeningText}>Listening...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  buttonIcon: {
    fontSize: 20,
  },
  listeningText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '500',
  },
});
