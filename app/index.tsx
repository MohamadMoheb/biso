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

import { unlockAudio } from '../src/audio/unlock';
import { ThemeBackground, LaserBackground } from '../src/components/ThemeBackground';
import { CatCamGallery } from '../src/components/CatCamGallery';
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

function BrandMark({ size }: { size: number }) {
  const pulse = useSharedValue(1);
  const under = useSharedValue(0);
  const lift = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 780, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 780, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    under.value = withDelay(180, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    lift.value = withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(under);
      cancelAnimation(lift);
    };
  }, [lift, pulse, under]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.75 + 0.25 * ((pulse.value - 1) / 0.35),
  }));

  const underStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: under.value }],
    opacity: 0.35 + 0.45 * under.value,
  }));

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  const letter = {
    fontFamily: displayFont,
    fontSize: size,
    fontWeight: '700' as const,
    color: '#FFF6E8',
    letterSpacing: -1.2,
    lineHeight: size * 1.05,
    ...(Platform.OS === 'web'
      ? ({ textShadow: '0 2px 14px rgba(240,195,106,0.35)' } as object)
      : {
          textShadowColor: 'rgba(240,195,106,0.4)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 10,
        }),
  };

  const stemW = Math.max(10, Math.round(size * 0.28));
  const dot = Math.max(5, Math.round(size * 0.18));

  return (
    <Animated.View
      entering={FadeInDown.duration(480).springify().damping(16)}
      style={[styles.brandWrap, wrapStyle]}
      accessibilityRole="header"
      accessibilityLabel="Biso"
    >
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
                marginBottom: Math.max(2, size * 0.04),
              },
              dotStyle,
            ]}
          />
          <Text style={[letter, styles.brandStem]}>ı</Text>
        </View>
        <Text style={letter}>so</Text>
      </View>
      <Animated.View
        style={[
          styles.brandUnder,
          { height: Math.max(2, Math.round(size * 0.06)), borderRadius: 99 },
          underStyle,
        ]}
      />
    </Animated.View>
  );
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

  useEffect(() => {
    return () => {
      cancelAnimation(y);
      cancelAnimation(rot);
      cancelAnimation(scale);
    };
  }, [y, rot, scale]);

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
  // Scale with stage so floaters read clearly on large web canvases.
  const base = Math.max(64, Math.min(96, Math.round(Math.min(width, height) * 0.16)));

  return (
    <View style={StyleSheet.absoluteFill}>
      <ThemeBackground theme={theme} />
      <FloatEmoji emoji={samples[0]!} left={width * 0.12} top={height * 0.16} delay={0} size={base} />
      <FloatEmoji emoji={samples[1]!} left={width * 0.58} top={height * 0.12} delay={220} size={Math.round(base * 0.9)} />
      <FloatEmoji emoji={samples[2]!} left={width * 0.26} top={height * 0.38} delay={480} size={Math.round(base * 0.95)} />
      <FloatEmoji emoji={samples[3]!} left={width * 0.66} top={height * 0.42} delay={700} size={Math.round(base * 0.85)} />
      <FloatEmoji emoji={samples[4] ?? samples[0]!} left={width * 0.42} top={height * 0.24} delay={900} size={Math.round(base * 0.8)} />
    </View>
  );
}

function LaserStage({ width, height }: { width: number; height: number }) {
  const x = useSharedValue(width * 0.45);
  const y = useSharedValue(height * 0.28);
  const glow = useSharedValue(1);

  useEffect(() => {
    const minX = Math.max(24, width * 0.08);
    const maxX = Math.max(minX + 40, width * 0.88);
    const minY = Math.max(24, height * 0.08);
    const maxY = Math.max(minY + 40, height * 0.72);
    x.value = withRepeat(
      withSequence(
        withTiming(maxX, { duration: 1700, easing: Easing.inOut(Easing.cubic) }),
        withTiming(minX, { duration: 1500, easing: Easing.inOut(Easing.cubic) }),
        withTiming((minX + maxX) * 0.55, { duration: 1300, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
    y.value = withRepeat(
      withSequence(
        withTiming(maxY, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(minY, { duration: 1200, easing: Easing.inOut(Easing.cubic) }),
        withTiming((minY + maxY) * 0.45, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
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

  useEffect(() => {
    return () => {
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(glow);
    };
  }, [x, y, glow]);

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
    progress.value = withTiming(active ? 1 : 0, { duration: 160 });
  }, [active, progress]);

  const anim = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.55, 1]),
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
      </Animated.View>
    </Pressable>
  );
}

function IconToggle({
  on,
  iconOn,
  iconOff,
  label,
  onPress,
  size = 42,
  iconSize = 20,
}: {
  on: boolean;
  iconOn: ComponentProps<typeof Ionicons>['name'];
  iconOff: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  size?: number;
  iconSize?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={[
        styles.iconToggle,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.33),
        },
        on && styles.iconToggleOn,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
    >
      <Ionicons name={on ? iconOn : iconOff} size={iconSize} color={on ? '#1A1208' : '#E8DFD0'} />
    </Pressable>
  );
}

export default function Index() {
  const { width, height } = useWindowDimensions();
  const ui = useUiScale();
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

  // Unmount the animated stage while a play screen is on top — its infinite
  // Reanimated loops would otherwise keep burning UI-thread frames all session.
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

  const start = () => {
    tap();
    // Unlock the audio pipeline inside the Play gesture so SFX on the next
    // screen are not blocked by web autoplay / cold decode.
    unlockAudio();
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

  /** Float samples stay in the upper zone; the stage itself is full-bleed. */
  const floatH = Math.min(height * (ui.compactH ? 0.4 : 0.48), 400);
  const toggleSize = ui.narrow ? Math.max(40, ui.s(38)) : ui.tap;
  const toggleIcon = ui.narrow ? 18 : ui.s(20);
  const orb = ui.narrow ? 52 : ui.s(58);

  if (!focused) {
    // Blur fires after the push transition completes, so this swap is invisible.
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      {/* Full-bleed world stage — never cut into a black band under the dock */}
      <View style={styles.stageShell}>
        {mode === 'creatures' ? (
          <CreaturesStage themeId={themeId} width={width} height={floatH} />
        ) : (
          <LaserStage width={width} height={floatH} />
        )}
        <LinearGradient
          colors={[
            'rgba(6,8,10,0.5)',
            'transparent',
            'rgba(6,8,10,0.22)',
            'rgba(6,8,10,0.48)',
          ]}
          locations={[0, 0.16, 0.62, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} pointerEvents="box-none">
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.topRow, { paddingHorizontal: ui.padX, gap: ui.s(8) }]}
        >
          <BrandMark size={ui.font(ui.narrow ? 34 : 42)} />
          <View style={[styles.topActions, { gap: ui.narrow ? 6 : ui.s(8), flexShrink: 0 }]}>
            <IconToggle
              on={settings.soundEnabled}
              iconOn="volume-high"
              iconOff="volume-mute"
              label={settings.soundEnabled ? 'Mute' : 'Unmute'}
              size={toggleSize}
              iconSize={toggleIcon}
              onPress={() => {
                tap();
                setSoundEnabled(!settings.soundEnabled);
              }}
            />
            <IconToggle
              on={settings.hapticsEnabled}
              iconOn="pulse"
              iconOff="pulse-outline"
              label={settings.hapticsEnabled ? 'Haptics off' : 'Haptics on'}
              size={toggleSize}
              iconSize={toggleIcon}
              onPress={() => {
                tap();
                setHapticsEnabled(!settings.hapticsEnabled);
              }}
            />
            <IconToggle
              on={settings.catCamEnabled}
              iconOn="camera"
              iconOff="camera-outline"
              label={settings.catCamEnabled ? 'Cat Cam off' : 'Cat Cam on'}
              size={toggleSize}
              iconSize={toggleIcon}
              onPress={() => {
                tap();
                setCatCamEnabled(!settings.catCamEnabled);
              }}
            />
            <Pressable
              onPress={() => {
                tap();
                setGalleryOpen(true);
              }}
              hitSlop={6}
              style={[
                styles.iconToggle,
                {
                  width: toggleSize,
                  height: toggleSize,
                  borderRadius: Math.round(toggleSize * 0.33),
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open Cat Cam gallery"
            >
              <Ionicons name="images-outline" size={toggleIcon} color="#E8DFD0" />
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.spacer} pointerEvents="none" />

        <Animated.View
          entering={FadeInDown.delay(80).duration(420)}
          style={[
            styles.dock,
            {
              marginHorizontal: ui.padX - 2,
              marginBottom: ui.compactH ? 4 : 8,
              paddingHorizontal: ui.s(14),
              paddingTop: ui.compactH ? ui.s(10) : ui.s(14),
              paddingBottom: ui.compactH ? ui.s(10) : ui.s(14),
              borderRadius: ui.s(28),
              gap: ui.compactH ? 8 : 12,
              maxHeight: ui.compactH ? height * 0.52 : undefined,
            },
          ]}
        >
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: ui.compactH ? 8 : 12 }}
          >
          {mode === 'creatures' ? (
            <View style={styles.worldBlock}>
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
                      hitSlop={8}
                      style={[styles.worldOrb, on && styles.worldOrbOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={theme.title}
                    >
                      <LinearGradient
                        colors={theme.gradient}
                        style={[
                          styles.worldOrbFill,
                          {
                            width: orb,
                            height: orb,
                            borderRadius: orb / 2,
                          },
                          on && styles.worldOrbFillOn,
                        ]}
                      >
                        <Text style={[styles.worldOrbEmoji, { fontSize: ui.font(26) }]}>
                          {theme.emoji}
                        </Text>
                      </LinearGradient>
                      <Text
                        style={[
                          styles.worldOrbLabel,
                          { fontSize: ui.font(12) },
                          on && styles.worldOrbLabelOn,
                        ]}
                      >
                        {theme.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.worldHint, { fontSize: ui.font(13) }]}>
                {THEMES[themeId].subtitle}
              </Text>
            </View>
          ) : (
            <Text style={[styles.laserNote, { fontSize: ui.font(13) }]}>
              Drag to steer · Tap the red dot to catch
            </Text>
          )}

          <View style={[styles.modeRow, { gap: ui.s(10) }]}>
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

          <Pressable
            onPress={start}
            accessibilityRole="button"
            accessibilityLabel={`Play ${mode === 'creatures' ? 'Creatures' : 'Laser'}`}
          >
            <Animated.View
              style={[
                styles.playBtn,
                playStyle,
                {
                  minHeight: Math.max(ui.tap + 8, ui.s(56)),
                  borderRadius: ui.s(18),
                  gap: ui.s(8),
                },
              ]}
            >
              <Ionicons name="play" size={ui.s(22)} color="#1A1208" />
              <Text style={[styles.playText, { fontSize: ui.font(18) }]}>
                Play {mode === 'creatures' ? THEMES[themeId].title : 'Laser'}
              </Text>
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
                maxWidth: Math.min(360, ui.width - ui.padX * 2),
                borderRadius: ui.s(24),
                padding: ui.compactH ? ui.s(18) : ui.s(24),
              },
            ]}
          >
            <Text style={[styles.tipTitle, { fontSize: ui.font(ui.compactH ? 24 : 28) }]}>
              For cats, not thumbs
            </Text>
            <Text style={[styles.tipBody, { fontSize: ui.font(15), lineHeight: ui.font(23) }]}>
              Lay the phone flat. Tap floating creatures to wake them, then hit Play. Hold controls in
              play so paws do not leave by accident. Turn on Cat Cam for surprise POV selfies.
            </Text>
            <Pressable
              onPress={() => {
                markTipSeen();
                setTipOpen(false);
              }}
              style={[styles.tipBtn, { minHeight: ui.tap, borderRadius: ui.s(14) }]}
            >
              <Text style={[styles.tipBtnText, { fontSize: ui.font(16) }]}>Let&apos;s play</Text>
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
    backgroundColor: '#06080A',
  },
  stageShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWrap: {
    flexShrink: 1,
    alignItems: 'flex-start',
    gap: 4,
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
    backgroundColor: '#FF2E3C',
    shadowColor: '#FF4455',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  brandUnder: {
    alignSelf: 'stretch',
    backgroundColor: '#F0C36A',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconToggle: {
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
    backgroundColor: 'rgba(10,12,14,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modeRow: {
    flexDirection: 'row',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  modePillOn: {
    backgroundColor: 'rgba(240,195,106,0.18)',
    borderColor: '#F0C36A',
  },
  modePillOff: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modePillEmoji: {
    fontSize: 20,
  },
  modePillLabel: {
    flex: 1,
    fontFamily: bodyFont,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: 'rgba(247,240,228,0.45)',
  },
  modePillLabelOn: {
    color: '#F0C36A',
    fontWeight: '700',
  },
  worldBlock: {
    gap: 10,
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
  worldHint: {
    textAlign: 'center',
    fontFamily: bodyFont,
    fontSize: 13,
    color: 'rgba(247,240,228,0.5)',
    marginTop: -4,
  },
  laserNote: {
    textAlign: 'center',
    fontFamily: bodyFont,
    fontSize: 13,
    color: 'rgba(247,240,228,0.55)',
    paddingVertical: 8,
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
  },
  tipCard: {
    width: '100%',
    backgroundColor: '#12151A',
    borderWidth: 1,
    borderColor: 'rgba(240,195,106,0.25)',
  },
  tipTitle: {
    fontFamily: displayFont,
    fontWeight: '700',
    color: '#F7F0E4',
    textAlign: 'center',
  },
  tipBody: {
    marginTop: 10,
    fontFamily: bodyFont,
    color: 'rgba(247,240,228,0.65)',
    textAlign: 'center',
  },
  tipBtn: {
    marginTop: 18,
    backgroundColor: '#F0C36A',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBtnText: {
    color: '#1A1208',
    fontFamily: bodyFont,
    fontWeight: '700',
  },
});
