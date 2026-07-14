import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeBackground } from '../src/components/ThemeBackground';
import { useSettings } from '../src/settings/SettingsContext';
import { DIFFICULTY_META, type Difficulty } from '../src/settings/types';
import { THEME_LIST, THEMES, type ThemeId } from '../src/themes';

const COUNT_OPTIONS = [2, 4, 6, 8, 12] as const;
const SESSION_OPTIONS: Array<0 | 5 | 10 | 15> = [0, 5, 10, 15];
const DIFFICULTIES = Object.keys(DIFFICULTY_META) as Difficulty[];

type ModeId = 'creatures' | 'laser';

const MODES: {
  id: ModeId;
  title: string;
  hint: string;
  emoji: string;
}[] = [
  { id: 'creatures', title: 'Creatures', hint: 'Living chase', emoji: '🦎' },
  { id: 'laser', title: 'Laser', hint: 'Zippy red dot', emoji: '🔴' },
];

function FloatEmoji({
  emoji,
  left,
  top,
  delay,
  size = 42,
}: {
  emoji: string;
  left: `${number}%`;
  top: `${number}%`;
  delay: number;
  size?: number;
}) {
  const y = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    rot.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(8, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, rot, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.Text style={[{ position: 'absolute', left, top, fontSize: size }, style]}>
      {emoji}
    </Animated.Text>
  );
}

function LaserPreview() {
  const x = useSharedValue(40);
  const y = useSharedValue(50);

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(200, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(40, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(140, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    y.value = withRepeat(
      withSequence(
        withTiming(110, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
        withTiming(30, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(90, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [x, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <View style={styles.previewFill}>
      <LinearGradient
        colors={['#0A0C10', '#151820', '#0D1016']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.laserDot, style]} />
    </View>
  );
}

function CreaturesPreview({ themeId }: { themeId: ThemeId }) {
  const theme = THEMES[themeId];
  const samples = theme.entities.slice(0, 4);

  return (
    <View style={styles.previewFill}>
      <ThemeBackground theme={theme} />
      <FloatEmoji emoji={samples[0]!} left="12%" top="18%" delay={0} size={44} />
      <FloatEmoji emoji={samples[1]!} left="58%" top="14%" delay={280} size={36} />
      <FloatEmoji emoji={samples[2]!} left="26%" top="48%" delay={520} size={40} />
      <FloatEmoji emoji={samples[3]!} left="64%" top="52%" delay={760} size={34} />
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export default function Index() {
  const {
    settings,
    setCreatureCount,
    setDifficulty,
    setSessionMinutes,
    setSoundEnabled,
    setHapticsEnabled,
    markTipSeen,
    ready,
  } = useSettings();

  const [mode, setMode] = useState<ModeId>('creatures');
  const [themeId, setThemeId] = useState<ThemeId>(THEME_LIST[0]!.id);
  const [tipOpen, setTipOpen] = useState(false);

  useEffect(() => {
    if (ready && !settings.tipSeen) setTipOpen(true);
  }, [ready, settings.tipSeen]);

  const countValue = COUNT_OPTIONS.includes(
    settings.creatureCount as (typeof COUNT_OPTIONS)[number],
  )
    ? (settings.creatureCount as (typeof COUNT_OPTIONS)[number])
    : 4;

  const tap = () => {
    if (settings.hapticsEnabled) {
      void Haptics.selectionAsync().catch(() => undefined);
    }
  };

  const start = () => {
    tap();
    if (mode === 'laser') {
      router.push('/laser');
      return;
    }
    router.push({
      pathname: '/play/[theme]',
      params: { theme: themeId, count: String(settings.creatureCount) },
    });
  };

  const selectedMode = MODES.find((m) => m.id === mode)!;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <LinearGradient
        colors={['#070B0A', '#0C1210', '#0A1016']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>Biso</Text>

          <View style={styles.stage}>
            {mode === 'creatures' ? (
              <CreaturesPreview themeId={themeId} />
            ) : (
              <LaserPreview />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(7,11,10,0.5)', 'rgba(7,11,10,0.88)']}
              style={styles.stageFade}
            />
            <View style={styles.stageCopy} pointerEvents="none">
              <Text style={styles.stageEmoji}>{selectedMode.emoji}</Text>
              <Text style={styles.stageTitle}>{selectedMode.title}</Text>
              <Text style={styles.stageHint}>{selectedMode.hint}</Text>
            </View>
          </View>

          <View style={styles.modeRow}>
            {MODES.map((m) => {
              const on = m.id === mode;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    tap();
                    setMode(m.id);
                  }}
                  style={[styles.modeTile, on && styles.modeTileOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={styles.modeEmoji}>{m.emoji}</Text>
                  <Text style={[styles.modeLabel, on && styles.modeLabelOn]}>{m.title}</Text>
                </Pressable>
              );
            })}
          </View>

          {mode === 'creatures' ? (
            <>
              <Text style={styles.sectionLabel}>World</Text>
              <View style={styles.worldRow}>
                {THEME_LIST.map((theme) => {
                  const on = theme.id === themeId;
                  return (
                    <Pressable
                      key={theme.id}
                      onPress={() => {
                        tap();
                        setThemeId(theme.id);
                      }}
                      style={[styles.worldPress, on && styles.worldPressOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <LinearGradient
                        colors={theme.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.worldCard}
                      >
                        <Text style={styles.worldEmoji}>{theme.emoji}</Text>
                        <Text style={styles.worldTitle}>{theme.title}</Text>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>Creatures at once</Text>
              <View style={styles.chipRow}>
                {COUNT_OPTIONS.map((n) => (
                  <Chip
                    key={n}
                    label={String(n)}
                    selected={countValue === n}
                    onPress={() => {
                      tap();
                      setCreatureCount(n);
                    }}
                  />
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Pace</Text>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((id) => (
              <Chip
                key={id}
                label={DIFFICULTY_META[id].label}
                selected={settings.difficulty === id}
                onPress={() => {
                  tap();
                  setDifficulty(id);
                }}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Break reminder</Text>
          <View style={styles.chipRow}>
            {SESSION_OPTIONS.map((m) => (
              <Chip
                key={m}
                label={m === 0 ? 'Off' : `${m}m`}
                selected={settings.sessionMinutes === m}
                onPress={() => {
                  tap();
                  setSessionMinutes(m);
                }}
              />
            ))}
          </View>

          <View style={styles.toggleBlock}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Sound</Text>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(v) => {
                  tap();
                  setSoundEnabled(v);
                }}
                trackColor={{ true: '#C8E6C9', false: '#2A3531' }}
                thumbColor="#F4F0E8"
              />
            </View>
            <View style={styles.toggleLine} />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Haptics</Text>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ true: '#C8E6C9', false: '#2A3531' }}
                thumbColor="#F4F0E8"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.startBtn, pressed && styles.startPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Play ${selectedMode.title}`}
          >
            <Text style={styles.startText}>Play {selectedMode.title}</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={tipOpen} transparent animationType="fade">
        <View style={styles.tipScrim}>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Lay the phone flat</Text>
            <Text style={styles.tipBody}>
              Pick Creatures or Laser, then Play. Hold back, sound, or pause so paws do not leave by
              mistake.
            </Text>
            <Pressable
              onPress={() => {
                markTipSeen();
                setTipOpen(false);
              }}
              style={styles.tipBtn}
            >
              <Text style={styles.tipBtnText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const displayFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

const bodyFont = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  default: 'System',
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#070B0A',
  },
  shell: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
  },
  brand: {
    fontFamily: displayFont,
    fontSize: 36,
    lineHeight: 40,
    color: '#F0EBE3',
    letterSpacing: -1,
    fontWeight: '700',
    marginBottom: 12,
  },
  stage: {
    height: 210,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#101816',
    marginBottom: 12,
  },
  previewFill: {
    ...StyleSheet.absoluteFill,
  },
  laserDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF2D3A',
    shadowColor: '#FF4455',
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  stageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
  },
  stageCopy: {
    position: 'absolute',
    left: 18,
    bottom: 16,
  },
  stageEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  stageTitle: {
    fontFamily: displayFont,
    fontSize: 28,
    lineHeight: 32,
    color: '#F7F2E8',
    fontWeight: '700',
  },
  stageHint: {
    marginTop: 2,
    fontFamily: bodyFont,
    fontSize: 14,
    color: 'rgba(247,242,232,0.72)',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modeTile: {
    flex: 1,
    minHeight: 84,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modeTileOn: {
    backgroundColor: 'rgba(200,230,201,0.18)',
  },
  modeEmoji: {
    fontSize: 28,
  },
  modeLabel: {
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '600',
    color: '#9AA59E',
  },
  modeLabelOn: {
    color: '#F0EBE3',
  },
  sectionLabel: {
    marginTop: 4,
    marginBottom: 8,
    fontFamily: bodyFont,
    fontSize: 13,
    fontWeight: '700',
    color: '#7A8A82',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  worldRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  worldPress: {
    flex: 1,
    borderRadius: 16,
    opacity: 0.72,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  worldPressOn: {
    opacity: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  worldCard: {
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  worldEmoji: {
    fontSize: 24,
  },
  worldTitle: {
    fontFamily: bodyFont,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipOn: {
    backgroundColor: '#C8E6C9',
  },
  chipText: {
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '600',
    color: '#D8D2C8',
  },
  chipTextOn: {
    color: '#0B1210',
  },
  toggleBlock: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
  },
  toggleRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toggleLabel: {
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '600',
    color: '#E8E2D8',
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(7,11,10,0.94)',
  },
  startBtn: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  startText: {
    fontFamily: bodyFont,
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1210',
  },
  tipScrim: {
    flex: 1,
    backgroundColor: 'rgba(4,8,7,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tipCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#16201C',
    padding: 22,
  },
  tipTitle: {
    fontFamily: displayFont,
    fontSize: 28,
    fontWeight: '700',
    color: '#F0EBE3',
    textAlign: 'center',
  },
  tipBody: {
    marginTop: 10,
    fontFamily: bodyFont,
    fontSize: 16,
    lineHeight: 24,
    color: '#9AA59E',
    textAlign: 'center',
  },
  tipBtn: {
    marginTop: 18,
    backgroundColor: '#C8E6C9',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  tipBtnText: {
    color: '#0B1210',
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '700',
  },
});
