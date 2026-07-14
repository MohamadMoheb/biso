import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettings } from '../src/settings/SettingsContext';
import { THEME_LIST, type Theme } from '../src/themes';

const COUNT_OPTIONS = [2, 4, 6, 8, 12] as const;

type ModeId = 'creatures' | 'laser' | 'wand';

const MODES: { id: ModeId; title: string; subtitle: string; emoji: string }[] = [
  {
    id: 'creatures',
    title: 'Creatures',
    subtitle: 'Chase fish, lizards, bunnies & more',
    emoji: '🦎',
  },
  {
    id: 'laser',
    title: 'Laser',
    subtitle: 'Classic red-dot hunt',
    emoji: '🔴',
  },
  {
    id: 'wand',
    title: 'Feather wand',
    subtitle: 'One soft target on a string',
    emoji: '🪶',
  },
];

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
      accessibilityLabel={`${theme.title}. ${theme.subtitle}`}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.themeButton}
      >
        <Text style={styles.themeEmoji}>{theme.emoji}</Text>
        <View style={styles.themeCopy}>
          <Text style={styles.themeTitle}>{theme.title}</Text>
          <Text style={styles.themeSubtitle}>{theme.subtitle}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function Index() {
  const { settings, setCreatureCount, markTipSeen, ready } = useSettings();
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={{ width: 44 }} />
          <View style={styles.hero}>
            <Text style={styles.brand}>Biso</Text>
            <Text style={styles.tagline}>Play that cats can't resist</Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Text style={styles.iconBtnText}>⚙️</Text>
          </Pressable>
        </View>

        {(settings.totalCatches > 0 || settings.sessionsPlayed > 0) && (
          <View style={styles.statsStrip}>
            <Text style={styles.statsText}>
              {settings.totalCatches} caught / {settings.bestStreak} best streak /{' '}
              {settings.sessionsPlayed} sessions
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Play mode</Text>
        <View style={styles.modeList}>
          {MODES.map((m) => {
            const selected = m.id === mode;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                style={[styles.modeCard, selected && styles.modeCardSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={styles.modeEmoji}>{m.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>
                    {m.title}
                  </Text>
                  <Text style={[styles.modeSubtitle, selected && styles.modeSubtitleSelected]}>
                    {m.subtitle}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {mode === 'creatures' ? (
          <>
            <Text style={styles.sectionLabel}>On screen at once</Text>
            <View style={styles.densityRow}>
              {COUNT_OPTIONS.map((n) => {
                const selected = n === settings.creatureCount;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setCreatureCount(n)}
                    style={[styles.countChip, selected && styles.countChipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.countText, selected && styles.countTextSelected]}>{n}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>World</Text>
            <View style={styles.themeList}>
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
              ? 'Drag anywhere for a bright laser. It roams on its own when you lift your finger.'
              : 'Guide a feather wand with your finger, or let it drift for a gentler hunt.'}
          </Text>
        )}

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
              Place the phone flat. Tap or swipe targets. Keep sessions short - Biso will nudge you
              when it's break time.
            </Text>
            <Pressable
              onPress={() => {
                markTipSeen();
                setTipOpen(false);
              }}
              style={styles.tipBtn}
            >
              <Text style={styles.tipBtnText}>Let's play</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
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
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,42,36,0.06)',
  },
  iconBtnText: { fontSize: 20 },
  statsStrip: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  statsText: {
    fontFamily: bodyFont,
    fontSize: 13,
    color: '#5A6B62',
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 10,
    fontFamily: bodyFont,
    fontSize: 14,
    color: '#5A6B62',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  modeList: { gap: 10 },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(28,42,36,0.06)',
  },
  modeCardSelected: {
    backgroundColor: '#1C2A24',
  },
  modeEmoji: { fontSize: 30 },
  modeTitle: {
    fontFamily: displayFont,
    fontSize: 22,
    color: '#1C2A24',
    fontWeight: '700',
  },
  modeTitleSelected: { color: '#F7F2E8' },
  modeSubtitle: {
    marginTop: 2,
    fontFamily: bodyFont,
    fontSize: 14,
    color: '#5A6B62',
  },
  modeSubtitleSelected: { color: 'rgba(247,242,232,0.82)' },
  modeHint: {
    marginTop: 12,
    fontFamily: bodyFont,
    fontSize: 15,
    lineHeight: 22,
    color: '#4A5A52',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  densityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  countChip: {
    minWidth: 48,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 42, 36, 0.06)',
  },
  countChipSelected: { backgroundColor: '#1C2A24' },
  countText: {
    fontFamily: bodyFont,
    fontSize: 17,
    fontWeight: '600',
    color: '#1C2A24',
  },
  countTextSelected: { color: '#F7F2E8' },
  themeList: { gap: 12 },
  themePress: { borderRadius: 24, opacity: 0.72 },
  themeSelected: { opacity: 1, transform: [{ scale: 1.01 }] },
  themePressed: { opacity: 0.9 },
  themeButton: {
    minHeight: 92,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  themeEmoji: { fontSize: 42 },
  themeCopy: { flex: 1 },
  themeTitle: {
    fontFamily: displayFont,
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  themeSubtitle: {
    marginTop: 2,
    fontFamily: bodyFont,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
  },
  startBtn: {
    marginTop: 24,
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
