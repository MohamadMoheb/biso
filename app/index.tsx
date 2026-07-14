import Ionicons from '@react-native-vector-icons/ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeBackground, LaserBackground } from '../src/components/ThemeBackground';
import { useSettings } from '../src/settings/SettingsContext';
import { DIFFICULTY_META, type Difficulty } from '../src/settings/types';
import { THEME_LIST, THEMES, type ThemeId } from '../src/themes';

const COUNT_OPTIONS = [2, 4, 6, 8, 12] as const;
const SESSION_OPTIONS: Array<0 | 5 | 10 | 15> = [0, 5, 10, 15];
const DIFFICULTIES = Object.keys(DIFFICULTY_META) as Difficulty[];

type ModeId = 'creatures' | 'laser';

function cycle<T>(list: readonly T[], current: T, dir: 1 | -1): T {
  const i = list.indexOf(current);
  const next = (i + dir + list.length) % list.length;
  return list[next]!;
}

function FloatEmoji({
  emoji,
  left,
  top,
  delay,
  size,
}: {
  emoji: string;
  left: number;
  top: number;
  delay: number;
  size: number;
}) {
  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-14, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(10, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    rot.value = withDelay(
      delay + 120,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2100, easing: Easing.inOut(Easing.quad) }),
          withTiming(10, { duration: 2100, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, rot, y]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Pressable
      onPress={() => {
        scale.value = withSequence(
          withSpring(1.35, { damping: 8 }),
          withSpring(1, { damping: 12 }),
        );
      }}
      style={{ position: 'absolute', left, top }}
    >
      <Animated.Text style={[{ fontSize: size }, style]}>{emoji}</Animated.Text>
    </Pressable>
  );
}

function CreaturesStage({ themeId, width, height }: { themeId: ThemeId; width: number; height: number }) {
  const theme = THEMES[themeId];
  const samples = theme.entities.slice(0, 5);

  return (
    <View style={StyleSheet.absoluteFill}>
      <ThemeBackground theme={theme} />
      <FloatEmoji emoji={samples[0]!} left={width * 0.12} top={height * 0.18} delay={0} size={52} />
      <FloatEmoji emoji={samples[1]!} left={width * 0.62} top={height * 0.14} delay={220} size={44} />
      <FloatEmoji emoji={samples[2]!} left={width * 0.28} top={height * 0.38} delay={480} size={48} />
      <FloatEmoji emoji={samples[3]!} left={width * 0.68} top={height * 0.42} delay={700} size={40} />
      <FloatEmoji emoji={samples[4] ?? samples[0]!} left={width * 0.44} top={height * 0.26} delay={900} size={36} />
    </View>
  );
}

function LaserStage({ width, height }: { width: number; height: number }) {
  const x = useSharedValue(width * 0.2);
  const y = useSharedValue(height * 0.25);
  const glow = useSharedValue(1);

  useEffect(() => {
    const maxX = Math.max(40, width - 60);
    const maxY = Math.max(40, height * 0.55);
    x.value = withRepeat(
      withSequence(
        withTiming(maxX * 0.85, { duration: 1700, easing: Easing.inOut(Easing.cubic) }),
        withTiming(maxX * 0.15, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
        withTiming(maxX * 0.55, { duration: 1300, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
    y.value = withRepeat(
      withSequence(
        withTiming(maxY * 0.7, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(maxY * 0.2, { duration: 1200, easing: Easing.inOut(Easing.cubic) }),
        withTiming(maxY * 0.5, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(withTiming(1.35, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true,
    );
  }, [glow, height, width, x, y]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: glow.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <LaserBackground />
      <Animated.View style={[styles.laserHalo, dotStyle]} />
      <Animated.View style={[styles.laserCore, dotStyle]} />
    </View>
  );
}

function ModePill({
  active,
  label,
  emoji,
  onPress,
}: {
  active: boolean;
  label: string;
  emoji: string;
  onPress: () => void;
}) {
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, { damping: 16, stiffness: 180 });
  }, [active, progress]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.96, 1]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1 }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[styles.modePill, active ? styles.modePillOn : styles.modePillOff, anim]}>
        <Text style={styles.modePillEmoji}>{emoji}</Text>
        <Text style={[styles.modePillLabel, active && styles.modePillLabelOn]}>{label}</Text>
        {active ? (
          <Ionicons name="checkmark-circle" size={18} color="#1A1208" style={styles.modeCheck} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function CycleControl({
  label,
  value,
  onPrev,
  onNext,
}: {
  label: string;
  value: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.cycle}>
      <Text style={styles.cycleLabel}>{label}</Text>
      <View style={styles.cycleRow}>
        <Pressable onPress={onPrev} hitSlop={10} style={styles.cycleBtn} accessibilityLabel={`${label} previous`}>
          <Ionicons name="chevron-back" size={18} color="#F0E6D2" />
        </Pressable>
        <Text style={styles.cycleValue}>{value}</Text>
        <Pressable onPress={onNext} hitSlop={10} style={styles.cycleBtn} accessibilityLabel={`${label} next`}>
          <Ionicons name="chevron-forward" size={18} color="#F0E6D2" />
        </Pressable>
      </View>
    </View>
  );
}

function IconToggle({
  on,
  iconOn,
  iconOff,
  label,
  onPress,
}: {
  on: boolean;
  iconOn: ComponentProps<typeof Ionicons>['name'];
  iconOff: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.iconToggle, on && styles.iconToggleOn]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
    >
      <Ionicons name={on ? iconOn : iconOff} size={20} color={on ? '#1A1208' : '#E8DFD0'} />
    </Pressable>
  );
}

export default function Index() {
  const { width, height } = useWindowDimensions();
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
  const playScale = useSharedValue(1);

  useEffect(() => {
    if (ready && !settings.tipSeen) setTipOpen(true);
  }, [ready, settings.tipSeen]);

  const countValue = COUNT_OPTIONS.includes(
    settings.creatureCount as (typeof COUNT_OPTIONS)[number],
  )
    ? (settings.creatureCount as (typeof COUNT_OPTIONS)[number])
    : 4;

  const tap = () => {
    if (settings.hapticsEnabled) void Haptics.selectionAsync().catch(() => undefined);
  };

  const start = () => {
    tap();
    playScale.value = withSequence(withSpring(0.94), withSpring(1));
    if (mode === 'laser') {
      router.push('/laser');
      return;
    }
    router.push({
      pathname: '/play/[theme]',
      params: { theme: themeId, count: String(settings.creatureCount) },
    });
  };

  const playStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const stageH = Math.min(height * 0.52, 420);

  return (
    <View style={styles.root}>
      <View style={[styles.stageShell, { height: stageH + 120 }]}>
        {mode === 'creatures' ? (
          <CreaturesStage themeId={themeId} width={width} height={stageH + 80} />
        ) : (
          <LaserStage width={width} height={stageH + 80} />
        )}
        <LinearGradient
          colors={['rgba(6,8,10,0.55)', 'transparent', 'transparent', 'rgba(6,8,10,0.95)']}
          locations={[0, 0.18, 0.55, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} pointerEvents="box-none">
        <Animated.View entering={FadeIn.duration(400)} style={styles.topRow}>
          <Text style={styles.brand}>Biso</Text>
          <View style={styles.topActions}>
            <IconToggle
              on={settings.soundEnabled}
              iconOn="volume-high"
              iconOff="volume-mute"
              label={settings.soundEnabled ? 'Mute' : 'Unmute'}
              onPress={() => {
                tap();
                setSoundEnabled(!settings.soundEnabled);
              }}
            />
            <IconToggle
              on={settings.hapticsEnabled}
              iconOn="radio-button-on"
              iconOff="radio-button-off"
              label={settings.hapticsEnabled ? 'Haptics off' : 'Haptics on'}
              onPress={() => {
                tap();
                setHapticsEnabled(!settings.hapticsEnabled);
              }}
            />
          </View>
        </Animated.View>

        <View style={styles.spacer} pointerEvents="none" />

        <Animated.View entering={FadeInDown.delay(80).duration(420)} style={styles.dock}>
          <View style={styles.modeRow}>
            <ModePill
              active={mode === 'creatures'}
              label="Creatures"
              emoji="🦎"
              onPress={() => {
                tap();
                setMode('creatures');
              }}
            />
            <ModePill
              active={mode === 'laser'}
              label="Laser"
              emoji="🔴"
              onPress={() => {
                tap();
                setMode('laser');
              }}
            />
          </View>

          {mode === 'creatures' ? (
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
                    style={[styles.worldOrb, on && styles.worldOrbOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={theme.title}
                  >
                    <LinearGradient
                      colors={theme.gradient}
                      style={[styles.worldOrbFill, on && styles.worldOrbFillOn]}
                    >
                      <Text style={styles.worldOrbEmoji}>{theme.emoji}</Text>
                    </LinearGradient>
                    <Text style={[styles.worldOrbLabel, on && styles.worldOrbLabelOn]}>
                      {theme.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.laserNote}>Drag to steer · Tap the red dot to catch</Text>
          )}

          <View style={styles.controls}>
            {mode === 'creatures' ? (
              <CycleControl
                label="Count"
                value={String(countValue)}
                onPrev={() => {
                  tap();
                  setCreatureCount(cycle(COUNT_OPTIONS, countValue, -1));
                }}
                onNext={() => {
                  tap();
                  setCreatureCount(cycle(COUNT_OPTIONS, countValue, 1));
                }}
              />
            ) : null}
            <CycleControl
              label="Pace"
              value={DIFFICULTY_META[settings.difficulty].label}
              onPrev={() => {
                tap();
                setDifficulty(cycle(DIFFICULTIES, settings.difficulty, -1));
              }}
              onNext={() => {
                tap();
                setDifficulty(cycle(DIFFICULTIES, settings.difficulty, 1));
              }}
            />
            <CycleControl
              label="Break"
              value={settings.sessionMinutes === 0 ? 'Off' : `${settings.sessionMinutes}m`}
              onPrev={() => {
                tap();
                setSessionMinutes(cycle(SESSION_OPTIONS, settings.sessionMinutes, -1));
              }}
              onNext={() => {
                tap();
                setSessionMinutes(cycle(SESSION_OPTIONS, settings.sessionMinutes, 1));
              }}
            />
          </View>

          <Pressable
            onPress={start}
            accessibilityRole="button"
            accessibilityLabel={`Play ${mode === 'creatures' ? 'Creatures' : 'Laser'}`}
          >
            <Animated.View style={[styles.playBtn, playStyle]}>
              <Ionicons name="play" size={22} color="#1A1208" />
              <Text style={styles.playText}>
                Play {mode === 'creatures' ? THEMES[themeId].title : 'Laser'}
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      <Modal visible={tipOpen} transparent animationType="fade">
        <View style={styles.tipScrim}>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>For cats, not thumbs</Text>
            <Text style={styles.tipBody}>
              Lay the phone flat. Tap floating creatures to wake them, then hit Play. Hold controls in
              play so paws do not leave by accident.
            </Text>
            <Pressable
              onPress={() => {
                markTipSeen();
                setTipOpen(false);
              }}
              style={styles.tipBtn}
            >
              <Text style={styles.tipBtnText}>Let&apos;s play</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
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
  root: {
    flex: 1,
    backgroundColor: '#06080A',
  },
  stageShell: {
    ...StyleSheet.absoluteFill,
    top: 0,
  },
  laserHalo: {
    position: 'absolute',
    width: 54,
    height: 54,
    marginLeft: -13,
    marginTop: -13,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 60, 70, 0.28)',
  },
  laserCore: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF2E3C',
    shadowColor: '#FF4455',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: displayFont,
    fontSize: 34,
    color: '#F7F0E4',
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconToggle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconToggleOn: {
    backgroundColor: '#F0C36A',
    borderColor: '#F0C36A',
  },
  spacer: {
    flex: 1,
  },
  dock: {
    marginHorizontal: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(12,14,16,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    minHeight: 54,
  },
  modePillOn: {
    backgroundColor: '#F0C36A',
    borderColor: '#F0C36A',
  },
  modePillOff: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.72,
  },
  modePillEmoji: {
    fontSize: 22,
  },
  modePillLabel: {
    flex: 1,
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(247,240,228,0.55)',
  },
  modePillLabelOn: {
    color: '#1A1208',
    fontWeight: '700',
  },
  modeCheck: {
    marginLeft: 'auto',
  },
  worldRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 2,
  },
  worldOrb: {
    alignItems: 'center',
    gap: 6,
    opacity: 0.55,
  },
  worldOrbOn: {
    opacity: 1,
    transform: [{ scale: 1.06 }],
  },
  worldOrbFill: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  worldOrbFillOn: {
    borderColor: '#F0C36A',
  },
  worldOrbEmoji: {
    fontSize: 26,
  },
  worldOrbLabel: {
    fontFamily: bodyFont,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(247,240,228,0.55)',
  },
  worldOrbLabelOn: {
    color: '#F0C36A',
  },
  laserNote: {
    textAlign: 'center',
    fontFamily: bodyFont,
    fontSize: 13,
    color: 'rgba(247,240,228,0.55)',
    paddingVertical: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  cycle: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cycleLabel: {
    textAlign: 'center',
    fontFamily: bodyFont,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(247,240,228,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cycleBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleValue: {
    fontFamily: bodyFont,
    fontSize: 15,
    fontWeight: '700',
    color: '#F7F0E4',
    minWidth: 52,
    textAlign: 'center',
  },
  playBtn: {
    marginTop: 2,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#F0C36A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playText: {
    fontFamily: bodyFont,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1208',
  },
  tipScrim: {
    flex: 1,
    backgroundColor: 'rgba(4,6,8,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tipCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#12151A',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(240,195,106,0.25)',
  },
  tipTitle: {
    fontFamily: displayFont,
    fontSize: 28,
    fontWeight: '700',
    color: '#F7F0E4',
    textAlign: 'center',
  },
  tipBody: {
    marginTop: 10,
    fontFamily: bodyFont,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(247,240,228,0.65)',
    textAlign: 'center',
  },
  tipBtn: {
    marginTop: 18,
    backgroundColor: '#F0C36A',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  tipBtnText: {
    color: '#1A1208',
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '700',
  },
});
