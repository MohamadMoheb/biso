import { router } from 'expo-router';
import {
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

const SESSION_OPTIONS: Array<0 | 5 | 10 | 15> = [0, 5, 10, 15];

export default function SettingsScreen() {
  const {
    settings,
    setSoundEnabled,
    setHapticsEnabled,
    setDifficulty,
    setSessionMinutes,
  } = useSettings();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Feedback</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Sound</Text>
            <Text style={styles.rowSub}>Creature pops & movement cues</Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ true: '#1C2A24', false: '#C9D0CB' }}
          />
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Haptics</Text>
            <Text style={styles.rowSub}>Vibrate on catch</Text>
          </View>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ true: '#1C2A24', false: '#C9D0CB' }}
          />
        </View>

        <Text style={styles.section}>Difficulty</Text>
        {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((id) => {
          const meta = DIFFICULTY_META[id];
          const selected = settings.difficulty === id;
          return (
            <Pressable
              key={id}
              onPress={() => setDifficulty(id)}
              style={[styles.choice, selected && styles.choiceOn]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.choiceTitle, selected && styles.choiceTitleOn]}>{meta.label}</Text>
              <Text style={[styles.choiceSub, selected && styles.choiceSubOn]}>{meta.blurb}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.section}>Session reminder</Text>
        <View style={styles.chipRow}>
          {SESSION_OPTIONS.map((m) => {
            const selected = settings.sessionMinutes === m;
            return (
              <Pressable
                key={m}
                onPress={() => setSessionMinutes(m)}
                style={[styles.chip, selected && styles.chipOn]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                  {m === 0 ? 'Off' : `${m}m`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>
          Short sessions are easier on cats' eyes and keep play exciting.
        </Text>

        <Text style={styles.section}>Lifetime lifetime</Text>
        <Text style={styles.lifetime}>
          {settings.totalCatches} catches · {settings.bestStreak} best streak ·{' '}
          {settings.sessionsPlayed} sessions
        </Text>
      </ScrollView>
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
  safe: { flex: 1, backgroundColor: '#F7F2E8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,42,36,0.06)',
  },
  backText: { fontSize: 20, color: '#1C2A24', fontWeight: '700' },
  title: {
    fontFamily: displayFont,
    fontSize: 28,
    fontWeight: '700',
    color: '#1C2A24',
  },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  section: {
    marginTop: 22,
    marginBottom: 10,
    fontFamily: bodyFont,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#5A6B62',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(28,42,36,0.12)',
  },
  rowTitle: {
    fontFamily: bodyFont,
    fontSize: 17,
    fontWeight: '600',
    color: '#1C2A24',
  },
  rowSub: {
    marginTop: 2,
    fontFamily: bodyFont,
    fontSize: 13,
    color: '#5A6B62',
  },
  choice: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(28,42,36,0.06)',
    marginBottom: 8,
  },
  choiceOn: { backgroundColor: '#1C2A24' },
  choiceTitle: {
    fontFamily: bodyFont,
    fontSize: 17,
    fontWeight: '700',
    color: '#1C2A24',
  },
  choiceTitleOn: { color: '#F7F2E8' },
  choiceSub: {
    marginTop: 2,
    fontFamily: bodyFont,
    fontSize: 13,
    color: '#5A6B62',
  },
  choiceSubOn: { color: 'rgba(247,242,232,0.8)' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    minWidth: 58,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,42,36,0.06)',
    paddingHorizontal: 12,
  },
  chipOn: { backgroundColor: '#1C2A24' },
  chipText: {
    fontFamily: bodyFont,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C2A24',
  },
  chipTextOn: { color: '#F7F2E8' },
  note: {
    marginTop: 10,
    fontFamily: bodyFont,
    fontSize: 13,
    lineHeight: 19,
    color: '#5A6B62',
  },
  lifetime: {
    fontFamily: bodyFont,
    fontSize: 15,
    color: '#1C2A24',
    fontWeight: '600',
  },
});
