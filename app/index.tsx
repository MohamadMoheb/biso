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
import { THEME_LIST, type Theme } from '../src/themes';

const COUNT_OPTIONS = [2, 4, 6, 8, 12] as const;
const SESSION_OPTIONS: Array<0 | 5 | 10 | 15> = [0, 5, 10, 15];
const DIFFICULTIES = Object.keys(DIFFICULTY_META) as Difficulty[];

type ModeId = 'creatures' | 'laser' | 'wand';

const MODES: { id: ModeId; title: string; blurb: string; emoji: string }[] = [
  { id: 'creatures', title: 'Creatures', blurb: 'Living targets', emoji: '🦎' },
  { id: 'laser', title: 'Laser', blurb: 'Bright red dot', emoji: '🔴' },
  { id: 'wand', title: 'Wand', blurb: 'Soft feather', emoji: '🪶' },
];

function ChipRow<T extends string | number>({
  options,
  value,
  labelFor,
  onChange,
}: {
  options: readonly T[];
  value: T;
  labelFor: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={String(opt)}
            onPress={() => onChange(opt)}
            style={[styles.chip, selected && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipText, selected && styles.chipTextOn]}>{labelFor(opt)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ThemeButton({
  theme,
  selected,
  onSelect,
}: {
  theme: Theme;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.themePress,
        selected && styles.themeSelected,
        pressed && styles.themePressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={theme.title}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.themeButton}
      >
        <Text style={styles.themeEmoji}>{theme.emoji}</Text>
        <Text style={styles.themeTitle}>{theme.title}</Text>
      </LinearGradient>
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
  const [themeId, setThemeId] = useState(THEME_LIST[0]!.id);
  const [tipOpen, setTipOpen] = useState(false);

  useEffect(() => {
    if (ready && !settings.tipSeen) setTipOpen(true);
  }, [ready, settings.tipSeen]);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <LinearGradient
        colors={['#F7F2E8', '#E8F0EC', '#DDE8F2']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>Biso</Text>
          <Text style={styles.tagline}>Cat play, ready when you are</Text>
        </View>

        <Text style={styles.sectionLabel}>Mode</Text>
        <View style={styles.modeRow}>
          {MODES.map((m) => {
            const selected = m.id === mode;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                style={[styles.modeCard, selected && styles.modeCardOn]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={styles.modeEmoji}>{m.emoji}</Text>
                <Text style={[styles.modeTitle, selected && styles.modeTitleOn]}>{m.title}</Text>
                <Text style={[styles.modeBlurb, selected && styles.modeBlurbOn]}>{m.blurb}</Text>
              </Pressable>
            );
          })}
        </View>

        {mode === 'creatures' ? (
          <>
            <Text style={styles.sectionLabel}>How many</Text>
            <ChipRow
              options={COUNT_OPTIONS}
              value={
                (COUNT_OPTIONS.includes(settings.creatureCount as (typeof COUNT_OPTIONS)[number])
                  ? settings.creatureCount
                  : 4) as (typeof COUNT_OPTIONS)[number]
              }
              labelFor={(n) => String(n)}
              onChange={setCreatureCount}
            />

            <Text style={styles.sectionLabel}>World</Text>
            <View style={styles.themeRow}>
              {THEME_LIST.map((theme) => (
                <ThemeButton
                  key={theme.id}
                  theme={theme}
                  selected={theme.id === themeId}
                  onSelect={() => setThemeId(theme.id)}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.modeHint}>
            {mode === 'laser'
              ? 'Drag to steer. Cats score by tapping the red dot.'
              : 'Drag the feather, or let it drift on its own.'}
          </Text>
        )}

        <Text style={styles.sectionLabel}>Pace</Text>
        <ChipRow
          options={DIFFICULTIES}
          value={settings.difficulty}
          labelFor={(id) => DIFFICULTY_META[id].label}
          onChange={setDifficulty}
        />
        <Text style={styles.hint}>{DIFFICULTY_META[settings.difficulty].blurb}</Text>

        <Text style={styles.sectionLabel}>Break after</Text>
        <ChipRow
          options={SESSION_OPTIONS}
          value={settings.sessionMinutes}
          labelFor={(m) => (m === 0 ? 'Off' : `${m} min`)}
          onChange={setSessionMinutes}
        />

        <Text style={styles.sectionLabel}>While playing</Text>
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Sound</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ true: '#1C2A24', false: '#C9D0CB' }}
            />
          </View>
          <View style={styles.toggleDivider} />
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Haptics</Text>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ true: '#1C2A24', false: '#C9D0CB' }}
            />
          </View>
        </View>

        <Pressable
          onPress={start}
          style={({ pressed }) => [styles.startBtn, pressed && styles.startPressed]}
          accessibilityRole="button"
          accessibilityLabel="Start play"
        >
          <Text style={styles.startText}>Start</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={tipOpen} transparent animationType="fade">
        <View style={styles.tipScrim}>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>For your cat</Text>
            <Text style={styles.tipBody}>
              Lay the phone flat. Cats bat the targets. Hold back or pause so paws do not leave by
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
    backgroundColor: '#F7F2E8',
  },
  scroll: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  brand: {
    fontFamily: displayFont,
    fontSize: 64,
    lineHeight: 70,
    color: '#1C2A24',
    letterSpacing: -1.5,
    fontWeight: '700',
  },
  tagline: {
    marginTop: 4,
    fontFamily: bodyFont,
    fontSize: 16,
    color: '#4A5A52',
    textAlign: 'center',
  },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 10,
    fontFamily: bodyFont,
    fontSize: 13,
    color: '#5A6B62',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(28,42,36,0.06)',
  },
  modeCardOn: {
    backgroundColor: '#1C2A24',
  },
  modeEmoji: { fontSize: 26, marginBottom: 6 },
  modeTitle: {
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '700',
    color: '#1C2A24',
  },
  modeTitleOn: { color: '#F7F2E8' },
  modeBlurb: {
    marginTop: 2,
    fontFamily: bodyFont,
    fontSize: 11,
    color: '#5A6B62',
    textAlign: 'center',
  },
  modeBlurbOn: { color: 'rgba(247,242,232,0.75)' },
  modeHint: {
    fontFamily: bodyFont,
    fontSize: 15,
    lineHeight: 22,
    color: '#4A5A52',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,42,36,0.06)',
  },
  chipOn: { backgroundColor: '#1C2A24' },
  chipText: {
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '600',
    color: '#1C2A24',
  },
  chipTextOn: { color: '#F7F2E8' },
  hint: {
    marginTop: 8,
    fontFamily: bodyFont,
    fontSize: 13,
    color: '#5A6B62',
  },
  themeRow: { gap: 10 },
  themePress: { borderRadius: 18, opacity: 0.75 },
  themeSelected: { opacity: 1 },
  themePressed: { opacity: 0.9 },
  themeButton: {
    minHeight: 72,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  themeEmoji: { fontSize: 34 },
  themeTitle: {
    fontFamily: displayFont,
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(28,42,36,0.06)',
    paddingHorizontal: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(28,42,36,0.12)',
  },
  toggleLabel: {
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2A24',
  },
  startBtn: {
    marginTop: 28,
    backgroundColor: '#1C2A24',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
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
