import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { transcribeAudio, parseVoiceIntent, filterRestaurantsByIntent, VoiceIntent } from '../src/services/voice';
import { setVoiceState } from '../src/services/voiceState';
import { Restaurant } from '../types';

type RecordState = 'idle' | 'listening' | 'processing' | 'error';

interface Props {
  restaurants: Restaurant[];
  onResult: () => void;
}

// Five animated waveform bars
function WaveformBars({ active }: { active: boolean }) {
  const bars = useRef([...Array(5)].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (!active) {
      bars.forEach((b) => Animated.timing(b, { toValue: 0.3, duration: 200, useNativeDriver: true }).start());
      return;
    }
    const anims = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 80),
          Animated.timing(bar, { toValue: 1, duration: 300 + i * 40, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.25, duration: 300 + i * 40, useNativeDriver: true }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [active, bars]);

  return (
    <View style={styles.waveform}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            { transform: [{ scaleY: bar }] },
          ]}
        />
      ))}
    </View>
  );
}

// Expanding pulse rings behind the mic button while recording
function PulseRings({ active }: { active: boolean }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      ring1.setValue(0);
      ring2.setValue(0);
      return;
    }
    const animate = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(val, { toValue: 1, duration: 1400, useNativeDriver: true }),
          ]),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    const a1 = animate(ring1, 0);
    const a2 = animate(ring2, 700);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [active, ring1, ring2]);

  const ring = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.25, 0] }),
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
  });

  return (
    <>
      <Animated.View style={[styles.pulseRing, ring(ring1)]} />
      <Animated.View style={[styles.pulseRing, ring(ring2)]} />
    </>
  );
}

export default function VoiceMic({ restaurants, onResult }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<RecordState>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleMicPress = async () => {
    if (state === 'idle') {
      await startListening();
    } else if (state === 'listening') {
      await stopAndProcess();
    }
  };

  const startListening = async () => {
    setErrorMsg('');
    setTranscript('');
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        setErrorMsg('Microphone permission denied.');
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('listening');
      setModalVisible(true);
    } catch {
      setErrorMsg('Could not start recording.');
    }
  };

  const stopAndProcess = async () => {
    setState('processing');
    try {
      await recorder.stop();
      const uri = recorder.uri;

      const text = uri ? await transcribeAudio(uri) : '我想吃辣的中国菜';
      setTranscript(text);

      const intent = parseVoiceIntent(text);
      const results = filterRestaurantsByIntent(restaurants, intent);
      setVoiceState(intent, results);

      // Brief pause so user sees the transcript, then navigate
      await new Promise((r) => setTimeout(r, 600));
      setModalVisible(false);
      setState('idle');
      onResult();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Processing failed.';
      setErrorMsg(msg);
      setState('error');
    }
  };

  const handleCancel = async () => {
    if (state === 'listening') {
      try { await recorder.stop(); } catch { /* ignore */ }
    }
    setModalVisible(false);
    setState('idle');
    setTranscript('');
    setErrorMsg('');
  };

  return (
    <>
      {/* Mic trigger button — sits inline in the search bar */}
      <TouchableOpacity
        style={styles.micTrigger}
        onPress={handleMicPress}
        activeOpacity={0.75}
      >
        <Ionicons name="mic" size={16} color={Colors.primary} />
      </TouchableOpacity>

      {/* Full-screen recording overlay */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Hint text */}
            <Text style={styles.hintText}>
              {state === 'listening'
                ? 'Listening...'
                : state === 'processing'
                ? transcript
                  ? `"${transcript}"`
                  : 'Processing...'
                : errorMsg || 'Something went wrong'}
            </Text>

            {state === 'listening' && (
              <Text style={styles.hintSub}>
                Try: "辣的中国菜" · "spicy ramen" · "cheap Korean near me"
              </Text>
            )}

            {/* Animated mic button */}
            <View style={styles.micArea}>
              <PulseRings active={state === 'listening'} />
              <TouchableOpacity
                style={[
                  styles.micButton,
                  state === 'listening' && styles.micButtonActive,
                  state === 'processing' && styles.micButtonProcessing,
                ]}
                onPress={state === 'listening' ? stopAndProcess : undefined}
                activeOpacity={state === 'listening' ? 0.85 : 1}
                disabled={state === 'processing'}
              >
                {state === 'processing' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons
                    name={state === 'listening' ? 'stop' : 'mic'}
                    size={32}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
            </View>

            <WaveformBars active={state === 'listening'} />

            {state === 'listening' && (
              <Text style={styles.tapHint}>Tap to finish</Text>
            )}

            {state === 'error' && (
              <Text style={styles.errorText}>{errorMsg}</Text>
            )}

            {/* Cancel */}
            {state !== 'processing' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const MIC_SIZE = 80;

const styles = StyleSheet.create({
  micTrigger: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  hintText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    minHeight: 28,
  },
  hintSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  micArea: {
    width: MIC_SIZE * 2.5,
    height: MIC_SIZE * 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  pulseRing: {
    position: 'absolute',
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: Colors.primary,
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  micButtonActive: {
    backgroundColor: Colors.primary,
  },
  micButtonProcessing: {
    backgroundColor: Colors.textSecondary,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
  },
  waveBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  tapHint: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  cancelText: {
    ...Typography.label,
    color: Colors.textMuted,
  },
});
