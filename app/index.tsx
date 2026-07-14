import { LinearGradient } from 'expo-linear-gradient';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettings } from '../src/settings/SettingsContext';
import { DIFFICULTY_META, type Difficulty } from '../src/settings/types';
import { THEME_LIST, type ThemeId } from '../src/themes';

const COUNT_OPTIONS = [2, 4, 6, 8, 12] as const;
const SESSION_OPTIONS: Array<0 | 5 | 10 | 15> = [0, 5, 10, 15];
const DIFFICULTIES = Object.keys(DIFFICULTY_META) as Difficulty[];

type ModeId = 'creatures' | 'laser' | 'wand';

const MODES: {
  id: ModeId;
  title: string;
  subtitle: string;
  emoji: string;
}[] = [
  {
    id: 'creatures',
    title: 'Creatures',
    subtitle: 'Fish, lizards, bunnies, and more',
    emoji: '🦎',
  },
  {
    id: 'laser',
    title: 'Laser',
    subtitle: 'A bright red dot to chase',
    emoji: '🔴',
  },
  {
    id: 'wand',
    title: 'Wand',
    subtitle: 'A soft feather on a string',
    emoji: '🪶',
  },
];

function Pill({
  label,
  selected,
  onPress,
  flex,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  flex?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, flex && styles.pillFlex, selected && styles.pillOn]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.pillText, selected && styles.pillTextOn]} numberOfLines={1}>
        {label}
      </Text>
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  useEffect(() => {
    if (ready && !settings.tipSeen) setTipOpen(true);
  }, [ready, settings.tipSeen]);

  const countValue = COUNT_OPTIONS.includes(
    settings.creatureCount as (typeof COUNT_OPTIONS)[number],
  )
    ? (settings.creatureCount as (typeof COUNT_OPTIONS)[number])
    : 4;

  const start = () => {
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
        colors={['#F4F0E8', '#E7EEEA', '#DDE6F0']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
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

          <Text style={styles.step}>1. Choose a game</Text>
          <View style={styles.modeList}>
            {MODES.map((m) => {
              const on = m.id === mode;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMode(m.id)}
                  style={[styles.modeRow, on && styles.modeRowOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={styles.modeEmoji}>{m.emoji}</Text>
                  <View style={styles.modeCopy}>
                    <Text style={[styles.modeTitle, on && styles.modeTitleOn]}>{m.title}</Text>
                    <Text style={[styles.modeSub, on && styles.modeSubOn]}>{m.subtitle}</Text>
                  </View>
                  <View style={[styles.radio, on && styles.radioOn]} />
                </Pressable>
              );
            })}
          </View>

          {mode === 'creatures' ? (
            <>
              <Text style={styles.step}>2. Pick a world</Text>
              <View style={styles.worldRow}>
                {THEME_LIST.map((theme) => {
                  const on = theme.id === themeId;
                  return (
                    <Pressable
                      key={theme.id}
                      onPress={() => setThemeId(theme.id)}
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

              <Text style={styles.step}>3. How many at once</Text>
              <View style={styles.pillRow}>
                {COUNT_OPTIONS.map((n) => (
                  <Pill
                    key={n}
                    label={String(n)}
                    selected={countValue === n}
                    onPress={() => setCreatureCount(n)}
                    flex
                  />
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.readyNote}>
              {selectedMode.title} is ready. Adjust pace below if you want.
            </Text>
          )}

          <Text style={styles.step}>{mode === 'creatures' ? '4. Pace' : '2. Pace'}</Text>
          <View style={styles.pillRow}>
            {DIFFICULTIES.map((id) => (
              <Pill
                key={id}
                label={DIFFICULTY_META[id].label}
                selected={settings.difficulty === id}
                onPress={() => setDifficulty(id)}
                flex
              />
            ))}
          </View>

          <Pressable
            onPress={() => setMoreOpen((v) => !v)}
            style={styles.moreToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: moreOpen }}
          >
            <Text style={styles.moreToggleText}>{moreOpen ? 'Hide options' : 'More options'}</Text>
            <Text style={styles.moreChevron}>{moreOpen ? '˄' : '˅'}</Text>
          </Pressable>

          {moreOpen ? (
            <View style={styles.morePanel}>
              <Text style={styles.moreLabel}>Break reminder</Text>
              <View style={styles.pillRow}>
                {SESSION_OPTIONS.map((m) => (
                  <Pill
                    key={m}
                    label={m === 0 ? 'Off' : `${m}m`}
                    selected={settings.sessionMinutes === m}
                    onPress={() => setSessionMinutes(m)}
                    flex
                  />
                ))}
              </View>

              <View style={styles.toggleList}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Sound</Text>
                  <Switch
                    value={settings.soundEnabled}
                    onValueChange={setSoundEnabled}
                    trackColor={{ true: '#1C2A24', false: '#C9D0CB' }}
                  />
                </View>
                <View style={styles.toggleLine} />
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Haptics</Text>
                  <Switch
                    value={settings.hapticsEnabled}
                    onValueChange={setHapticsEnabled}
                    trackColor={{ true: '#1C2A24', false: '#C9D0CB' }}
                  />
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={start}
            style={({ pressed }) => [styles.startBtn, pressed && styles.startPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Start ${selectedMode.title}`}
          >
            <Text style={styles.startText}>Start {selectedMode.title}</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={tipOpen} transparent animationType="fade">
        <View style={styles.tipScrim}>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Quick tip</Text>
            <Text style={styles.tipBody}>
              Lay the phone flat. Pick a game, then Start. Hold back or pause so paws do not leave by
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
    backgroundColor: '#F4F0E8',
  },
  shell: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  brand: {
    fontFamily: displayFont,
    fontSize: 48,
    lineHeight: 54,
    color: '#1C2A24',
    letterSpacing: -1.2,
    fontWeight: '700',
    marginBottom: 18,
  },
  step: {
    marginTop: 6,
    marginBottom: 10,
    fontFamily: bodyFont,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#5A6B62',
  },
  modeList: {
    gap: 8,
    marginBottom: 14,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(28,42,36,0.06)',
  },
  modeRowOn: {
    backgroundColor: '#1C2A24',
  },
  modeEmoji: {
    fontSize: 30,
    width: 36,
    textAlign: 'center',
  },
  modeCopy: {
    flex: 1,
  },
  modeTitle: {
    fontFamily: bodyFont,
    fontSize: 18,
    fontWeight: '700',
    color: '#1C2A24',
  },
  modeTitleOn: {
    color: '#F7F2E8',
  },
  modeSub: {
    marginTop: 2,
    fontFamily: bodyFont,
    fontSize: 13,
    color: '#5A6B62',
  },
  modeSubOn: {
    color: 'rgba(247,242,232,0.72)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(28,42,36,0.25)',
  },
  radioOn: {
    borderColor: '#F7F2E8',
    backgroundColor: '#F7F2E8',
  },
  readyNote: {
    marginBottom: 14,
    fontFamily: bodyFont,
    fontSize: 15,
    lineHeight: 22,
    color: '#4A5A52',
  },
  worldRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  worldPress: {
    flex: 1,
    borderRadius: 16,
    opacity: 0.72,
  },
  worldPressOn: {
    opacity: 1,
  },
  worldCard: {
    height: 88,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  worldEmoji: {
    fontSize: 28,
  },
  worldTitle: {
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,42,36,0.06)',
  },
  pillFlex: {
    flex: 1,
  },
  pillOn: {
    backgroundColor: '#1C2A24',
  },
  pillText: {
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '650',
    fontWeight: '600',
    color: '#1C2A24',
  },
  pillTextOn: {
    color: '#F7F2E8',
  },
  moreToggle: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(28,42,36,0.05)',
  },
  moreToggleText: {
    fontFamily: bodyFont,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C2A24',
  },
  moreChevron: {
    fontSize: 16,
    color: '#5A6B62',
  },
  morePanel: {
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(28,42,36,0.05)',
    gap: 8,
  },
  moreLabel: {
    fontFamily: bodyFont,
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B62',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  toggleList: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 12,
  },
  toggleRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(28,42,36,0.12)',
  },
  toggleLabel: {
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2A24',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(28,42,36,0.1)',
    backgroundColor: 'rgba(244,240,232,0.92)',
  },
  startBtn: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#1C2A24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startPressed: {
    opacity: 0.92,
  },
  startText: {
    color: '#F7F2E8',
    fontFamily: bodyFont,
    fontSize: 18,
    fontWeight: '700',
  },
  tipScrim: {
    flex: 1,
    backgroundColor: 'rgba(12,18,16,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tipCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#F7F2E8',
    padding: 22,
  },
  tipTitle: {
    fontFamily: displayFont,
    fontSize: 28,
    fontWeight: '700',
    color: '#1C2A24',
    textAlign: 'center',
  },
  tipBody: {
    marginTop: 10,
    fontFamily: bodyFont,
    fontSize: 16,
    lineHeight: 24,
    color: '#4A5A52',
    textAlign: 'center',
  },
  tipBtn: {
    marginTop: 18,
    backgroundColor: '#1C2A24',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  tipBtnText: {
    color: '#F7F2E8',
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '700',
  },
});
