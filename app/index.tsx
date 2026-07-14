import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { THEME_LIST, type Theme } from '../src/themes';

const COUNT_OPTIONS = [2, 4, 6, 8, 12] as const;

function ThemeButton({ theme, count }: { theme: Theme; count: number }) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/play/[theme]',
          params: { theme: theme.id, count: String(count) },
        })
      }
      style={({ pressed }) => [styles.themePress, pressed && styles.themePressed]}
      accessibilityRole="button"
      accessibilityLabel={`${theme.title}. ${theme.subtitle}. ${count} at once`}
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
  const [entityCount, setEntityCount] = useState<number>(4);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <LinearGradient
        colors={['#F7F2E8', '#E8F0EC', '#DDE8F2']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.atmosphere} pointerEvents="none">
        <View style={styles.glow} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.brand}>Biso</Text>
        <Text style={styles.tagline}>A playground for cats & kittens</Text>
      </View>

      <View style={styles.density}>
        <Text style={styles.densityLabel}>On screen at once</Text>
        <View style={styles.densityRow}>
          {COUNT_OPTIONS.map((n) => {
            const selected = n === entityCount;
            return (
              <Pressable
                key={n}
                onPress={() => setEntityCount(n)}
                style={[styles.countChip, selected && styles.countChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${n} creatures`}
              >
                <Text style={[styles.countText, selected && styles.countTextSelected]}>
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.choices}>
        {THEME_LIST.map((theme) => (
          <ThemeButton key={theme.id} theme={theme} count={entityCount} />
        ))}
      </View>
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
    paddingHorizontal: 24,
  },
  atmosphere: {
    ...StyleSheet.absoluteFill,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -40,
    alignSelf: 'center',
    left: '20%',
    backgroundColor: 'rgba(255, 220, 170, 0.35)',
  },
  hero: {
    paddingTop: 36,
    paddingBottom: 20,
    alignItems: 'center',
  },
  brand: {
    fontFamily: displayFont,
    fontSize: 72,
    lineHeight: 78,
    color: '#1C2A24',
    letterSpacing: -1.5,
    fontWeight: '700',
  },
  tagline: {
    marginTop: 8,
    fontFamily: bodyFont,
    fontSize: 17,
    lineHeight: 24,
    color: '#4A5A52',
    textAlign: 'center',
  },
  density: {
    marginBottom: 18,
    gap: 10,
  },
  densityLabel: {
    fontFamily: bodyFont,
    fontSize: 14,
    letterSpacing: 0.2,
    color: '#5A6B62',
    textAlign: 'center',
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
  countChipSelected: {
    backgroundColor: '#1C2A24',
  },
  countText: {
    fontFamily: bodyFont,
    fontSize: 17,
    fontWeight: '600',
    color: '#1C2A24',
  },
  countTextSelected: {
    color: '#F7F2E8',
  },
  choices: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 24,
  },
  themePress: {
    borderRadius: 28,
  },
  themePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  themeButton: {
    minHeight: 108,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    overflow: 'hidden',
  },
  themeEmoji: {
    fontSize: 48,
  },
  themeCopy: {
    flex: 1,
  },
  themeTitle: {
    fontFamily: displayFont,
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  themeSubtitle: {
    marginTop: 4,
    fontFamily: bodyFont,
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
  },
});
