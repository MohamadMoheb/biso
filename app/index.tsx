import Ionicons from '@react-native-vector-icons/ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { unlockAudio } from '../src/audio/unlock';
import { CatCamGallery } from '../src/components/CatCamGallery';
import { LaserBackground, ThemeBackground } from '../src/components/ThemeBackground';
import { useSettings } from '../src/settings/SettingsContext';
import { type PlayMode } from '../src/settings/types';
import { THEME_LIST, THEMES, type ThemeId } from '../src/themes';
import { useUiScale } from '../src/utils/layout';

const displayFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, "Palatino Linotype", Palatino, serif',
});

const bodyFont = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  default: 'System',
});

const INK = '#080A0F';
const PAPER = '#FFF8E9';
const GOLD = '#FFD166';
const RED = '#FF3347';

function BrandMark({ size }: { size: number }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  const underline = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 1;
      underline.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.28, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    underline.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.poly(4)) });
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(underline);
    };
  }, [pulse, reduceMotion, underline]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: underline.value }],
  }));

  const letter = {
    fontFamily: displayFont,
    fontSize: size,
    fontWeight: '700' as const,
    color: PAPER,
    letterSpacing: -1.4,
    lineHeight: size,
  };
  const stemW = Math.max(10, Math.round(size * 0.27));
  const dot = Math.max(6, Math.round(size * 0.19));

  return (
    <View style={styles.brandWrap} accessibilityRole="header" accessibilityLabel="Biso">
      <View style={styles.brandRow}>
        <Text style={letter}>B</Text>
        <View style={[styles.brandI, { width: stemW }]}>
          <Animated.View
            style={[
              styles.brandDot,
              {
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                marginBottom: Math.max(1, size * 0.025),
              },
              dotStyle,
            ]}
          />
          <Text style={[letter, styles.brandStem]}>ı</Text>
        </View>
        <Text style={letter}>so</Text>
      </View>
      <Animated.View style={[styles.brandUnderline, lineStyle]} />
    </View>
  );
}

function UtilityButton({
  on,
  iconOn,
  iconOff,
  label,
  onPress,
  size,
  iconSize,
}: {
  on?: boolean;
  iconOn: ComponentProps<typeof Ionicons>['name'];
  iconOff?: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  size: number;
  iconSize: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={5}
      style={({ pressed }) => [
        styles.utilityButton,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
        },
        on && styles.utilityButtonOn,
        pressed && styles.buttonPressed,
      ]}
      accessibilityRole={on === undefined ? 'button' : 'switch'}
      accessibilityLabel={label}
      accessibilityState={on === undefined ? undefined : { checked: on }}
    >
      <Ionicons
        name={on ? iconOn : (iconOff ?? iconOn)}
        size={iconSize}
        color={on ? INK : PAPER}
      />
      {on ? <View style={styles.utilityLiveDot} /> : null}
    </Pressable>
  );
}

function FloatSprite({
  emoji,
  left,
  top,
  delay,
  size,
  hero = false,
}: {
  emoji: string;
  left: number;
  top: number;
  delay: number;
  size: number;
  hero?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(hero ? -10 : -8, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
          withTiming(hero ? 8 : 6, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    rotation.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(hero ? -5 : -8, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(hero ? 5 : 8, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => {
      cancelAnimation(y);
      cancelAnimation(rotation);
    };
  }, [delay, hero, reduceMotion, rotation, y]);

  useEffect(
    () => () => {
      cancelAnimation(scale);
    },
    [scale],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Pressable
      onPress={() => {
        scale.value = withSequence(
          withTiming(1.16, { duration: 90 }),
          withTiming(1, { duration: 160, easing: Easing.out(Easing.poly(4)) }),
        );
      }}
      style={{ position: 'absolute', left, top }}
      accessibilityRole="button"
      accessibilityLabel={`Wake ${emoji}`}
    >
      <Animated.View style={animatedStyle}>
        <Text style={[styles.spriteText, { fontSize: size }]}>{emoji}</Text>
      </Animated.View>
    </Pressable>
  );
}

function CreaturesStage({
  themeId,
  width,
  height,
}: {
  themeId: ThemeId;
  width: number;
  height: number;
}) {
  const theme = THEMES[themeId];
  const samples = theme.entities;
  const hero = Math.max(88, Math.min(132, Math.round(Math.min(width, height) * 0.34)));
  const side = Math.round(hero * 0.52);

  return (
    <View style={StyleSheet.absoluteFill}>
      <ThemeBackground theme={theme} />
      <View style={[styles.stageContent, { width, height }]}>
        <FloatSprite
          emoji={samples[0]!}
          left={width * 0.5 - hero * 0.5}
          top={height * 0.28}
          delay={0}
          size={hero}
          hero
        />
        <FloatSprite
          emoji={samples[1]!}
          left={width * 0.13}
          top={height * 0.2}
          delay={180}
          size={side}
        />
        <FloatSprite
          emoji={samples[2]!}
          left={width * 0.74}
          top={height * 0.18}
          delay={340}
          size={Math.round(side * 0.9)}
        />
        <FloatSprite
          emoji={samples[3]!}
          left={width * 0.18}
          top={height * 0.56}
          delay={520}
          size={Math.round(side * 0.82)}
        />
        <FloatSprite
          emoji={samples[4] ?? samples[0]!}
          left={width * 0.73}
          top={height * 0.54}
          delay={680}
          size={Math.round(side * 0.86)}
        />
      </View>
    </View>
  );
}

function LaserStage({ width, height }: { width: number; height: number }) {
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(width * 0.5);
  const y = useSharedValue(height * 0.38);
  const glow = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      x.value = width * 0.5;
      y.value = height * 0.38;
      glow.value = 1;
      return;
    }
    const minX = Math.max(28, width * 0.12);
    const maxX = Math.max(minX + 40, width * 0.84);
    const minY = Math.max(50, height * 0.22);
    const maxY = Math.max(minY + 40, height * 0.62);
    x.value = withRepeat(
      withSequence(
        withTiming(maxX, { duration: 1450, easing: Easing.inOut(Easing.cubic) }),
        withTiming(minX, { duration: 1250, easing: Easing.inOut(Easing.cubic) }),
        withTiming(width * 0.52, { duration: 1100, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
    y.value = withRepeat(
      withSequence(
        withTiming(maxY, { duration: 1250, easing: Easing.inOut(Easing.cubic) }),
        withTiming(minY, { duration: 1050, easing: Easing.inOut(Easing.cubic) }),
        withTiming(height * 0.38, { duration: 1350, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(withTiming(1.28, { duration: 450 }), withTiming(1, { duration: 450 })),
      -1,
      true,
    );
    return () => {
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(glow);
    };
  }, [glow, height, reduceMotion, width, x, y]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: glow.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <LaserBackground />
      <View style={[styles.stageContent, { width, height }]}>
        <View style={[styles.laserAimRing, { left: width * 0.5 - 78, top: height * 0.36 - 78 }]} />
        <Animated.View style={[styles.laserHalo, dotStyle]} />
        <Animated.View style={[styles.laserCore, dotStyle]} />
      </View>
    </View>
  );
}

function ModeTile({
  active,
  label,
  caption,
  icon,
  accent,
  onPress,
}: {
  active: boolean;
  label: string;
  caption: string;
  icon: string;
  accent: string;
  onPress: () => void;
}) {
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.poly(4)),
    });
  }, [active, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.7, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.985, 1]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.modePressable, pressed && styles.buttonPressed]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}: ${caption}`}
    >
      <Animated.View
        style={[
          styles.modeTile,
          active && styles.modeTileOn,
          active && { borderColor: accent },
          animatedStyle,
        ]}
      >
        <View style={[styles.modeIconBox, active && { backgroundColor: accent }]}>
          <Text style={styles.modeIcon}>{icon}</Text>
        </View>
        <View style={styles.modeCopy}>
          <Text style={[styles.modeLabel, active && styles.modeLabelOn]}>{label}</Text>
          <Text style={[styles.modeCaption, active && styles.modeCaptionOn]} numberOfLines={1}>
            {caption}
          </Text>
        </View>
        <View style={[styles.modeIndicator, active && { backgroundColor: accent }]} />
      </Animated.View>
    </Pressable>
  );
}

function WorldButton({
  themeId,
  active,
  onPress,
  compact,
}: {
  themeId: ThemeId;
  active: boolean;
  onPress: () => void;
  compact: boolean;
}) {
  const theme = THEMES[themeId];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.worldPressable,
        active && styles.worldPressableOn,
        pressed && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${theme.title}: ${theme.subtitle}`}
    >
      <LinearGradient
        colors={theme.gradient}
        style={[styles.worldColor, { width: compact ? 34 : 40, height: compact ? 34 : 40 }]}
      >
        <Text style={{ fontSize: compact ? 18 : 21 }}>{theme.emoji}</Text>
      </LinearGradient>
      <Text style={[styles.worldLabel, active && styles.worldLabelOn]}>{theme.title}</Text>
      {active ? (
        <Ionicons
          name="checkmark-circle"
          size={17}
          color={GOLD}
          style={styles.worldCheck}
        />
      ) : null}
    </Pressable>
  );
}

export default function Index() {
  const { width, height } = useWindowDimensions();
  const ui = useUiScale();
  const reduceMotion = useReducedMotion();
  const {
    settings,
    setSoundEnabled,
    setHapticsEnabled,
    setCatCamEnabled,
    markTipSeen,
    ready,
  } = useSettings();

  const [mode, setMode] = useState<PlayMode>('creatures');
  const [themeId, setThemeId] = useState<ThemeId>(THEME_LIST[0]!.id);
  const [tipOpen, setTipOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [focused, setFocused] = useState(true);
  const playScale = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    if (ready && !settings.tipSeen) setTipOpen(true);
  }, [ready, settings.tipSeen]);

  const tap = () => {
    if (settings.hapticsEnabled) void Haptics.selectionAsync().catch(() => undefined);
  };

  const chooseMode = (nextMode: PlayMode) => {
    tap();
    setMode(nextMode);
  };

  const start = () => {
    tap();
    unlockAudio();
    if (!reduceMotion) {
      playScale.value = withSequence(
        withTiming(0.97, { duration: 80 }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.poly(4)) }),
      );
    }
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

  const stageWidth = Math.min(width, 760);
  const stageHeight = Math.max(230, height * (ui.compactH ? 0.6 : 0.66));
  const utilitySize = ui.tap;
  const utilityIcon = ui.narrow ? 17 : ui.s(19);
  const consoleWidth = Math.min(width - ui.padX * 2, 640);
  const activeTheme = THEMES[themeId];
  const playGradient: [string, string] =
    mode === 'laser' ? ['#FF5A63', '#FF243B'] : [GOLD, '#FFB83E'];

  if (!focused) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <View style={styles.stageShell}>
        {mode === 'creatures' ? (
          <CreaturesStage themeId={themeId} width={stageWidth} height={stageHeight} />
        ) : (
          <LaserStage width={stageWidth} height={stageHeight} />
        )}
        <LinearGradient
          colors={['rgba(8,10,15,0.38)', 'transparent', 'rgba(8,10,15,0.08)', '#080A0F']}
          locations={[0, 0.16, 0.54, 0.88]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.scanlines} pointerEvents="none" />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={[styles.topRow, { paddingHorizontal: ui.padX }]}>
          <BrandMark size={ui.font(ui.narrow ? 30 : 40)} />
          <View
            style={[
              styles.utilityRail,
              {
                gap: ui.narrow ? 3 : 7,
                padding: ui.narrow ? 3 : 5,
                borderRadius: ui.s(16),
              },
            ]}
          >
            <UtilityButton
              on={settings.soundEnabled}
              iconOn="volume-high"
              iconOff="volume-mute"
              label={settings.soundEnabled ? 'Mute sound' : 'Turn sound on'}
              size={utilitySize}
              iconSize={utilityIcon}
              onPress={() => {
                tap();
                setSoundEnabled(!settings.soundEnabled);
              }}
            />
            <UtilityButton
              on={settings.hapticsEnabled}
              iconOn="pulse"
              iconOff="pulse-outline"
              label={settings.hapticsEnabled ? 'Turn haptics off' : 'Turn haptics on'}
              size={utilitySize}
              iconSize={utilityIcon}
              onPress={() => {
                tap();
                setHapticsEnabled(!settings.hapticsEnabled);
              }}
            />
            <UtilityButton
              on={settings.catCamEnabled}
              iconOn="camera"
              iconOff="camera-outline"
              label={settings.catCamEnabled ? 'Turn Cat Cam off' : 'Turn Cat Cam on'}
              size={utilitySize}
              iconSize={utilityIcon}
              onPress={() => {
                tap();
                setCatCamEnabled(!settings.catCamEnabled);
              }}
            />
            <UtilityButton
              iconOn="images"
              label="Open Cat Cam gallery"
              size={utilitySize}
              iconSize={utilityIcon}
              onPress={() => {
                tap();
                setGalleryOpen(true);
              }}
            />
          </View>
        </View>

        <View
          style={[styles.heroCopy, { paddingHorizontal: ui.padX }]}
          pointerEvents="none"
        >
          <View style={styles.liveBadge}>
            <View style={[styles.liveBadgeDot, { backgroundColor: mode === 'laser' ? RED : GOLD }]} />
            <Text style={styles.liveBadgeText}>
              {mode === 'laser' ? 'Laser chase' : `${activeTheme.title} chase`}
            </Text>
          </View>
          <Text
            style={[
              styles.heroTitle,
              { fontSize: ui.font(ui.compactH ? 24 : 30) },
            ]}
          >
            {mode === 'laser' ? 'Catch the light.' : 'Pick a world. Start the chase.'}
          </Text>
        </View>

        <View style={styles.spacer} pointerEvents="none" />

        <Animated.View
          entering={
            reduceMotion ? undefined : FadeInDown.duration(260).easing(Easing.out(Easing.poly(4)))
          }
          style={[
            styles.console,
            {
              width: consoleWidth,
              padding: ui.compactH ? ui.s(10) : ui.s(13),
              borderRadius: ui.s(24),
              marginBottom: ui.compactH ? 2 : 6,
              maxHeight: ui.compactH ? height * 0.55 : undefined,
            },
          ]}
        >
          <View style={styles.consoleGrip}>
            <View style={styles.consoleGripLine} />
            <View style={styles.consoleGripLine} />
            <View style={styles.consoleGripLine} />
          </View>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={{ gap: ui.compactH ? 8 : 11 }}
          >
            <View style={[styles.modeRow, { gap: ui.s(8) }]}>
              <ModeTile
                active={mode === 'creatures'}
                label={ui.narrow ? 'Critters' : 'Creatures'}
                caption="World chase"
                icon="🐾"
                accent={GOLD}
                onPress={() => chooseMode('creatures')}
              />
              <ModeTile
                active={mode === 'laser'}
                label="Laser"
                caption="Light chase"
                icon="🔴"
                accent={RED}
                onPress={() => chooseMode('laser')}
              />
            </View>

            {mode === 'creatures' ? (
              <View style={styles.worldSection}>
                <View style={styles.worldHeader}>
                  <Text style={styles.worldTitle}>Choose the arena</Text>
                  <Text style={styles.worldHint}>{activeTheme.subtitle}</Text>
                </View>
                <View style={[styles.worldRow, { gap: ui.s(7) }]}>
                  {THEME_LIST.map((theme) => (
                    <WorldButton
                      key={theme.id}
                      themeId={theme.id}
                      active={theme.id === themeId}
                      compact={ui.compactH}
                      onPress={() => {
                        tap();
                        setThemeId(theme.id);
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.laserInstruction}>
                <View style={styles.laserInstructionIcon}>
                  <Ionicons name="move" size={20} color={PAPER} />
                </View>
                <View style={styles.laserInstructionCopy}>
                  <Text style={styles.laserInstructionTitle}>Fast paws ready?</Text>
                  <Text style={styles.laserInstructionText}>
                    Drag to steer. Tap the red dot to score.
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              onPress={start}
              style={({ pressed }) => [pressed && styles.playPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Play ${mode === 'creatures' ? `${activeTheme.title} creatures` : 'laser'}`}
              accessibilityHint="Starts a full-screen cat play session"
            >
              <Animated.View style={playStyle}>
                <LinearGradient
                  colors={playGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.playButton,
                    {
                      minHeight: Math.max(ui.tap + 10, ui.s(58)),
                      borderRadius: ui.s(16),
                    },
                  ]}
                >
                  <View style={styles.playIconDisc}>
                    <Ionicons name="play" size={ui.s(21)} color={PAPER} />
                  </View>
                  <View style={styles.playCopy}>
                    <Text style={[styles.playText, { fontSize: ui.font(18) }]}>
                      Play {mode === 'creatures' ? activeTheme.title : 'Laser'}
                    </Text>
                    <Text style={styles.playSubtext}>Start full-screen chase</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={ui.s(24)} color={INK} />
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <Modal
        visible={tipOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          markTipSeen();
          setTipOpen(false);
        }}
      >
        <View
          style={[
            styles.tipScrim,
            {
              paddingHorizontal: ui.padX + 8,
              paddingTop: ui.insets.top + 16,
              paddingBottom: ui.insets.bottom + 16,
            },
          ]}
        >
          <View
            style={[
              styles.tipCard,
              {
                maxWidth: Math.min(370, ui.width - ui.padX * 2),
                borderRadius: ui.s(24),
                padding: ui.compactH ? ui.s(18) : ui.s(24),
              },
            ]}
          >
            <View style={styles.tipIcon}>
              <Text style={styles.tipEmoji}>🐾</Text>
            </View>
            <Text style={[styles.tipTitle, { fontSize: ui.font(ui.compactH ? 24 : 28) }]}>
              Built for paws
            </Text>
            <Text style={[styles.tipBody, { fontSize: ui.font(15), lineHeight: ui.font(22) }]}>
              Lay the phone flat, choose a chase, then tap Play. Hold in-game controls so curious
              paws cannot leave by accident. Cat Cam can capture surprise selfies during play.
            </Text>
            <Pressable
              onPress={() => {
                markTipSeen();
                setTipOpen(false);
              }}
              style={({ pressed }) => [
                styles.tipButton,
                { minHeight: ui.tap, borderRadius: ui.s(14) },
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.tipButtonText, { fontSize: ui.font(16) }]}>Enter the arena</Text>
              <Ionicons name="arrow-forward" size={20} color={INK} />
            </Pressable>
          </View>
        </View>
      </Modal>

      <CatCamGallery visible={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: INK,
  },
  stageShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  stageContent: {
    alignSelf: 'center',
    position: 'relative',
  },
  scanlines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.08,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: PAPER,
  },
  spriteText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 12,
  },
  laserAimRing: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  laserHalo: {
    position: 'absolute',
    width: 66,
    height: 66,
    marginLeft: -19,
    marginTop: -19,
    borderRadius: 33,
    backgroundColor: 'rgba(255,51,71,0.28)',
  },
  laserCore: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RED,
    shadowColor: RED,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    paddingTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandWrap: {
    flexShrink: 1,
    alignItems: 'flex-start',
    gap: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandI: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  brandStem: {
    textAlign: 'center',
  },
  brandDot: {
    backgroundColor: RED,
    shadowColor: RED,
    shadowOpacity: 0.95,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
  },
  brandUnderline: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  utilityRail: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: 'rgba(8,10,15,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  utilityButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1E27',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  utilityButtonOn: {
    backgroundColor: GOLD,
    borderColor: '#FFF0B5',
  },
  utilityLiveDot: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: RED,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  heroCopy: {
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  liveBadge: {
    minHeight: 28,
    paddingHorizontal: 11,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(8,10,15,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  liveBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontFamily: bodyFont,
    fontSize: 13,
    fontWeight: '800',
    color: PAPER,
  },
  heroTitle: {
    maxWidth: 520,
    paddingHorizontal: 8,
    fontFamily: displayFont,
    fontWeight: '700',
    color: PAPER,
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  spacer: {
    flex: 1,
  },
  console: {
    alignSelf: 'center',
    backgroundColor: '#0C0F16',
    borderWidth: 2,
    borderColor: 'rgba(255,209,102,0.72)',
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    overflow: 'hidden',
  },
  consoleGrip: {
    position: 'absolute',
    top: 5,
    right: 14,
    flexDirection: 'row',
    gap: 3,
    opacity: 0.45,
  },
  consoleGripLine: {
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  modeRow: {
    flexDirection: 'row',
  },
  modePressable: {
    flex: 1,
  },
  modeTile: {
    minHeight: 62,
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#303744',
    backgroundColor: '#151A23',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  modeTileOn: {
    backgroundColor: '#202633',
  },
  modeIconBox: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A303C',
  },
  modeIcon: {
    fontSize: 22,
  },
  modeCopy: {
    flex: 1,
    minWidth: 0,
  },
  modeLabel: {
    fontFamily: bodyFont,
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,248,233,0.66)',
  },
  modeLabelOn: {
    color: PAPER,
  },
  modeCaption: {
    marginTop: 1,
    fontFamily: bodyFont,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,248,233,0.64)',
  },
  modeCaptionOn: {
    color: 'rgba(255,248,233,0.7)',
  },
  modeIndicator: {
    width: 6,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#39404D',
  },
  worldSection: {
    gap: 8,
  },
  worldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  worldTitle: {
    fontFamily: bodyFont,
    fontSize: 13,
    fontWeight: '800',
    color: PAPER,
  },
  worldHint: {
    flexShrink: 1,
    fontFamily: bodyFont,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,248,233,0.66)',
    textAlign: 'right',
  },
  worldRow: {
    flexDirection: 'row',
  },
  worldPressable: {
    position: 'relative',
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2B313D',
    backgroundColor: '#12161E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  worldPressableOn: {
    borderColor: GOLD,
    backgroundColor: '#22232A',
  },
  worldColor: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  worldLabel: {
    fontFamily: bodyFont,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,248,233,0.6)',
  },
  worldLabelOn: {
    color: PAPER,
  },
  worldCheck: {
    position: 'absolute',
    right: 3,
    top: 3,
  },
  laserInstruction: {
    minHeight: 62,
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,51,71,0.55)',
    backgroundColor: 'rgba(255,51,71,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  laserInstructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
  },
  laserInstructionCopy: {
    flex: 1,
  },
  laserInstructionTitle: {
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '800',
    color: PAPER,
  },
  laserInstructionText: {
    marginTop: 2,
    fontFamily: bodyFont,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,248,233,0.67)',
  },
  playPressed: {
    opacity: 0.85,
  },
  playButton: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  playIconDisc: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCopy: {
    flex: 1,
  },
  playText: {
    fontFamily: bodyFont,
    fontWeight: '900',
    color: INK,
  },
  playSubtext: {
    marginTop: 1,
    fontFamily: bodyFont,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(8,10,15,0.68)',
  },
  tipScrim: {
    flex: 1,
    backgroundColor: 'rgba(4,6,10,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#111620',
    borderWidth: 2,
    borderColor: GOLD,
  },
  tipIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    transform: [{ rotate: '-4deg' }],
  },
  tipEmoji: {
    fontSize: 34,
  },
  tipTitle: {
    marginTop: 14,
    fontFamily: displayFont,
    fontWeight: '700',
    color: PAPER,
    textAlign: 'center',
  },
  tipBody: {
    marginTop: 9,
    fontFamily: bodyFont,
    color: 'rgba(255,248,233,0.76)',
    textAlign: 'center',
  },
  tipButton: {
    alignSelf: 'stretch',
    marginTop: 18,
    paddingHorizontal: 16,
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tipButtonText: {
    color: INK,
    fontFamily: bodyFont,
    fontWeight: '900',
  },
});
