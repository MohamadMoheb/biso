import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { THEME_LIST, type Theme } from '../src/themes';

function ThemeButton({ theme }: { theme: Theme }) {
  return (
    <Pressable
      onPress={() => router.push(`/play/${theme.id}`)}
      style={({ pressed }) => [styles.themePress, pressed && styles.themePressed]}
      accessibilityRole="button"
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

      <View style={styles.choices}>
        {THEME_LIST.map((theme) => (
          <ThemeButton key={theme.id} theme={theme} />
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
    paddingBottom: 28,
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
