import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
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

type ModeId = 'creatures' | 'laser' | 'wand';

const MODES: {
  id: ModeId;
  title: string;
  hint: string;
  emoji: string;
}[] = [
  { id: 'creatures', title: 'Creatures', hint: 'Living chase', emoji: '🦎' },
  { id: 'laser', title: 'Laser', hint: 'Zippy red dot', emoji: '🔴' },
  { id: 'wand', title: 'Wand', hint: 'Soft feather', emoji: '🪶' },
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
  const y = useSharedValue(60);

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(220, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(50, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(160, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    y.value = withRepeat(
      withSequence(
        withTiming(140, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
        withTiming(40, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(110, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [x, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <View style={styles.laserStage}>
      <LinearGradient
        colors={['#0A0C10', '#151820', '#0D1016']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.laserDot, style]} />
    </View>
  );
}

function WandPreview() {
  const swing = useSharedValue(0);

  useEffect(() => {
    swing.value = withRepeat(
      withSequence(
        withTiming(18, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-16, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [swing]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swing.value}deg` }, { translateY: Math.abs(swing.value) * 0.4 }],
  }));

  return (
    <View style={styles.wandStage}>
      <LinearGradient
        colors={['#121018', '#1C1824', '#0E0C12']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.wandAnchor}>
        <View style={styles.wandString} />
        <Animated.Text style={[styles.wandFeather, style]}>🪶</Animated.Text>
      </View>
    </View>
  );
}

function CreaturesPreview({ themeId }: { themeId: ThemeId }) {
  const theme = THEMES[themeId];
  const samples = theme.entities.slice(0, 4);

  return (
    <View style={styles.creatureStage}>
      <ThemeBackground theme={theme} />
      <FloatEmoji emoji={samples[0]!} left="14%" top="22%" delay={0} size={48} />
      <FloatEmoji emoji={samples[1]!} left="58%" top="18%" delay={280} size={40} />
      <FloatEmoji emoji={samples[2]!} left="28%" top="52%" delay={520} size={44} />
      <FloatEmoji emoji={samples[3]!} left="66%" top="56%" delay={760} size={38} />
    </View>
  );
}

function OptionChip({
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
      style={[styles.optChip, selected && styles.optChipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.optChipText, selected && styles.optChipTextOn]}>{label}</Text>
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
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    if (mode === 'wand') {
      router.push('/wand');
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

      <View style={styles.topBar}>
        <Text style={styles.brand}>Biso</Text>
        <Pressable
          onPress={() => {
            tap();
            setSettingsOpen(true);
          }}
          style={styles.gearBtn}
          accessibilityRole="button"
          accessibilityLabel="Options"
        >
          <Text style={styles.gearText}>⋯</Text>
        </Pressable>
      </View>

      <View style={styles.stageWrap}>
        <View style={styles.stage}>
          {mode === 'creatures' ? (
            <CreaturesPreview themeId={themeId} />
          ) : mode === 'laser' ? (
            <LaserPreview />
          ) : (
            <WandPreview />
          )}

          <LinearGradient
            colors={['transparent', 'rgba(7,11,10,0.55)', 'rgba(7,11,10,0.92)']}
            style={styles.stageFade}
          />

          <View
            style={[styles.stageCopy, mode === 'creatures' && styles.stageCopyLift]}
            pointerEvents="none"
          >
            <Text style={styles.stageEmoji}>{selectedMode.emoji}</Text>
            <Text style={styles.stageTitle}>{selectedMode.title}</Text>
            <Text style={styles.stageHint}>{selectedMode.hint}</Text>
          </View>

          {mode === 'creatures' ? (
            <View style={styles.worldStrip}>
              {THEME_LIST.map((theme) => {
                const on = theme.id === themeId;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => {
                      tap();
                      setThemeId(theme.id);
                    }}
                    style={[styles.worldChip, on && styles.worldChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <LinearGradient
                      colors={theme.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.worldChipFill}
                    >
                      <Text style={styles.worldChipEmoji}>{theme.emoji}</Text>
                      <Text style={styles.worldChipLabel}>{theme.title}</Text>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={start}
          style={({ pressed }) => [styles.startBtn, pressed && styles.startPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Start ${selectedMode.title}`}
        >
          <Text style={styles.startText}>Play</Text>
        </Pressable>
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

      <Modal visible={settingsOpen} transparent animationType="slide">
        <Pressable style={styles.sheetScrim} onPress={() => setSettingsOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Options</Text>

            {mode === 'creatures' ? (
              <>
                <Text style={styles.sheetLabel}>Creatures at once</Text>
                <View style={styles.chipRow}>
                  {COUNT_OPTIONS.map((n) => (
                    <OptionChip
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

            <Text style={styles.sheetLabel}>Pace</Text>
            <View style={styles.chipRow}>
              {DIFFICULTIES.map((id) => (
                <OptionChip
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

            <Text style={styles.sheetLabel}>Break reminder</Text>
            <View style={styles.chipRow}>
              {SESSION_OPTIONS.map((m) => (
                <OptionChip
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

            <Pressable
              onPress={() => setSettingsOpen(false)}
              style={styles.sheetDone}
              accessibilityRole="button"
            >
              <Text style={styles.sheetDoneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={tipOpen} transparent animationType="fade">
        <View style={styles.tipScrim}>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Lay the phone flat</Text>
            <Text style={styles.tipBody}>
              Tap a game, then Play. Hold back, sound, or pause so paws do not leave by mistake.
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
    paddingHorizontal: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    marginBottom: 10,
  },
  brand: {
    fontFamily: displayFont,
    fontSize: 36,
    lineHeight: 40,
    color: '#F0EBE3',
    letterSpacing: -1,
    fontWeight: '700',
  },
  gearBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gearText: {
    color: '#E8E2D8',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -4,
  },
  stageWrap: {
    flex: 1,
    minHeight: 320,
  },
  stage: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#101816',
  },
  creatureStage: {
    ...StyleSheet.absoluteFillObject,
  },
  laserStage: {
    ...StyleSheet.absoluteFillObject,
  },
  laserDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF2D3A',
    shadowColor: '#FF4455',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  wandStage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wandAnchor: {
    alignItems: 'center',
  },
  wandString: {
    width: 2,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  wandFeather: {
    fontSize: 64,
    marginTop: -6,
  },
  stageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  stageCopy: {
    position: 'absolute',
    left: 20,
    bottom: 22,
  },
  stageCopyLift: {
    bottom: 78,
  },
  stageEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  stageTitle: {
    fontFamily: displayFont,
    fontSize: 34,
    lineHeight: 38,
    color: '#F7F2E8',
    fontWeight: '700',
  },
  stageHint: {
    marginTop: 4,
    fontFamily: bodyFont,
    fontSize: 15,
    color: 'rgba(247,242,232,0.72)',
  },
  worldStrip: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    flexDirection: 'row',
    gap: 8,
  },
  worldChip: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    opacity: 0.7,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  worldChipOn: {
    opacity: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  worldChipFill: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  worldChipEmoji: {
    fontSize: 18,
  },
  worldChipLabel: {
    fontFamily: bodyFont,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startBtn: {
    marginTop: 14,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  startText: {
    fontFamily: bodyFont,
    fontSize: 20,
    fontWeight: '700',
    color: '#0B1210',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 6,
  },
  modeTile: {
    flex: 1,
    minHeight: 88,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#9AA59E',
  },
  modeLabelOn: {
    color: '#F0EBE3',
  },
  sheetScrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#151C19',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: displayFont,
    fontSize: 26,
    color: '#F0EBE3',
    fontWeight: '700',
    marginBottom: 14,
  },
  sheetLabel: {
    marginTop: 10,
    marginBottom: 8,
    fontFamily: bodyFont,
    fontSize: 13,
    fontWeight: '700',
    color: '#7A8A82',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  optChipOn: {
    backgroundColor: '#C8E6C9',
  },
  optChipText: {
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '600',
    color: '#D8D2C8',
  },
  optChipTextOn: {
    color: '#0B1210',
  },
  toggleBlock: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
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
  sheetDone: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDoneText: {
    fontFamily: bodyFont,
    fontSize: 16,
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
