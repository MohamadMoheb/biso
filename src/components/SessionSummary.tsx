import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  catches: number;
  bestStreak: number;
  elapsedSec: number;
  title?: string;
  subtitle?: string;
  onPlayAgain: () => void;
  onHome: () => void;
};

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionSummary({
  catches,
  bestStreak,
  elapsedSec,
  title = 'Nice play!',
  subtitle = 'Your cat earned a rest.',
  onPlayAgain,
  onHome,
}: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{catches}</Text>
            <Text style={styles.statLabel}>Caught</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Best streak</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTime(elapsedSec)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>
        <Pressable
          onPress={onPlayAgain}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>Play again</Text>
        </Pressable>
        <Pressable
          onPress={onHome}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Back home</Text>
        </Pressable>
      </View>
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
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 18, 16, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: '#F7F2E8',
    padding: 24,
  },
  title: {
    fontFamily: displayFont,
    fontSize: 34,
    fontWeight: '700',
    color: '#1C2A24',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontFamily: bodyFont,
    fontSize: 16,
    color: '#4A5A52',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 22,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: bodyFont,
    fontSize: 26,
    fontWeight: '800',
    color: '#1C2A24',
  },
  statLabel: {
    marginTop: 2,
    fontFamily: bodyFont,
    fontSize: 12,
    color: '#5A6B62',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  primary: {
    backgroundColor: '#1C2A24',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#F7F2E8',
    fontFamily: bodyFont,
    fontSize: 17,
    fontWeight: '700',
  },
  secondary: {
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(28,42,36,0.08)',
  },
  secondaryText: {
    color: '#1C2A24',
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
});
