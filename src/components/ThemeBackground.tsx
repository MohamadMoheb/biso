import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Theme, ThemeId } from '../themes';

type ThemeBackgroundProps = {
  theme: Theme;
  /** Fewer decorative animations — use during play with many creatures. */
  lite?: boolean;
};

function DriftBubble({
  size,
  left,
  bottom,
  delay,
  travel,
  duration,
}: {
  size: number;
  left: `${number}%`;
  bottom: `${number}%`;
  delay: number;
  travel: number;
  duration: number;
}) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-travel, { duration, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: duration * 0.35 }),
          withTiming(0.15, { duration: duration * 0.65 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, duration, opacity, travel, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bubble,
        { width: size, height: size, left, bottom, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

function Twinkle({
  left,
  top,
  delay,
  size = 3,
}: {
  left: `${number}%`;
  top: `${number}%`;
  delay: number;
  size?: number;
}) {
  const opacity = useSharedValue(0.2);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.15, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.twinkle,
        { left, top, width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

function SwayBlade({
  left,
  height,
  delay,
  rotateBase,
  color,
}: {
  left: `${number}%`;
  height: number;
  delay: number;
  rotateBase: number;
  color: string;
}) {
  const rot = useSharedValue(rotateBase);
  useEffect(() => {
    rot.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(rotateBase + 8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(rotateBase - 6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, rotateBase, rot]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View
      style={[styles.blade, { left, height, backgroundColor: color }, style]}
    />
  );
}

function SeaDecor({ lite }: { lite?: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['rgba(90,210,255,0.35)', 'rgba(20,80,120,0.05)', 'transparent']}
        locations={[0, 0.35, 0.7]}
        style={styles.seaCanopy}
      />

      <View style={[styles.rayBeam, styles.rayA]} />
      <View style={[styles.rayBeam, styles.rayB]} />
      <View style={[styles.rayBeam, styles.rayC]} />
      {!lite ? <View style={[styles.rayBeam, styles.rayD]} /> : null}

      <View style={styles.caustic} />
      {!lite ? <View style={[styles.caustic, styles.caustic2]} /> : null}

      <DriftBubble size={14} left="12%" bottom="18%" delay={0} travel={220} duration={4200} />
      <DriftBubble size={18} left="48%" bottom="8%" delay={200} travel={240} duration={4600} />
      <DriftBubble size={12} left="78%" bottom="14%" delay={400} travel={280} duration={5200} />
      {!lite ? (
        <>
          <DriftBubble size={10} left="28%" bottom="12%" delay={600} travel={260} duration={5000} />
          <DriftBubble size={8} left="66%" bottom="22%" delay={900} travel={200} duration={3800} />
          <DriftBubble size={16} left="86%" bottom="30%" delay={1100} travel={180} duration={4000} />
          <DriftBubble size={9} left="38%" bottom="28%" delay={1500} travel={210} duration={4400} />
        </>
      ) : null}

      <View style={[styles.coral, styles.coralL]} />
      <View style={[styles.coral, styles.coralL2]} />
      <View style={[styles.coral, styles.coralR]} />
      {!lite ? <View style={[styles.coral, styles.coralR2]} /> : null}

      <View style={[styles.weedLeaf, styles.weedA]} />
      <View style={[styles.weedLeaf, styles.weedB]} />
      <View style={[styles.weedLeaf, styles.weedC]} />
      {!lite ? (
        <>
          <View style={[styles.weedLeaf, styles.weedD]} />
          <View style={[styles.weedLeaf, styles.weedE]} />
        </>
      ) : null}

      <LinearGradient
        colors={['transparent', 'rgba(6,34,52,0.55)', 'rgba(4,24,38,0.85)']}
        style={styles.seaBed}
      />
      <View style={styles.sandBar} />
      <View style={styles.sandSpeck1} />
      <View style={styles.sandSpeck2} />
      <View style={styles.sandSpeck3} />
    </View>
  );
}

function DesertDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#FFD089', '#F4A261', 'transparent']}
        locations={[0, 0.28, 0.62]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(180,90,40,0.25)']}
        style={styles.desertWarmth}
      />

      <View style={styles.sunAura} />
      <View style={styles.sunMid} />
      <View style={styles.sunCore} />

      <Twinkle left="18%" top="16%" delay={0} size={2} />
      <Twinkle left="42%" top="22%" delay={400} size={2} />
      <Twinkle left="70%" top="14%" delay={800} size={3} />

      <View style={styles.heatBand1} />
      <View style={styles.heatBand2} />
      <View style={styles.heatBand3} />

      <View style={styles.rockFar} />
      <View style={styles.rockNear} />

      <View style={[styles.cactus, styles.cactusTall]}>
        <View style={styles.armLeft} />
        <View style={styles.armRight} />
      </View>
      <View style={[styles.cactus, styles.cactusShort]}>
        <View style={[styles.armLeft, styles.armSmall]} />
      </View>
      <View style={[styles.cactus, styles.cactusTiny]} />

      <View style={[styles.dune, styles.duneFar]} />
      <View style={[styles.dune, styles.duneMid]} />
      <View style={[styles.dune, styles.duneNear]} />
      <LinearGradient
        colors={['rgba(255,220,160,0.0)', 'rgba(255,230,180,0.35)']}
        style={styles.sandGlow}
      />
    </View>
  );
}

function GrassDecor({ lite }: { lite?: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#7EC8F0', '#A8D8C0', 'transparent']}
        locations={[0, 0.4, 0.72]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.sunSoftHalo} />
      <View style={styles.sunSoft} />

      <View style={[styles.cloud, styles.cloud1]}>
        <View style={[styles.cloudPuff, styles.puffA]} />
        <View style={[styles.cloudPuff, styles.puffB]} />
      </View>
      <View style={[styles.cloud, styles.cloud2]}>
        <View style={[styles.cloudPuff, styles.puffC]} />
        <View style={[styles.cloudPuff, styles.puffD]} />
      </View>
      {!lite ? <View style={[styles.cloud, styles.cloud3]} /> : null}

      <View style={[styles.hill, styles.hillFar]} />
      <View style={[styles.hill, styles.hillMid]} />
      <View style={[styles.hill, styles.hillNear]} />

      <SwayBlade left="5%" height={52} delay={0} rotateBase={-10} color="rgba(34,100,55,0.65)" />
      <SwayBlade left="18%" height={46} delay={100} rotateBase={-4} color="rgba(40,110,58,0.6)" />
      <SwayBlade left="50%" height={54} delay={150} rotateBase={-8} color="rgba(42,115,60,0.6)" />
      <SwayBlade left="80%" height={36} delay={50} rotateBase={-6} color="rgba(48,120,62,0.5)" />
      {!lite ? (
        <>
          <SwayBlade left="10%" height={38} delay={200} rotateBase={6} color="rgba(48,120,62,0.55)" />
          <SwayBlade left="42%" height={40} delay={300} rotateBase={8} color="rgba(36,105,55,0.55)" />
          <SwayBlade left="72%" height={44} delay={250} rotateBase={10} color="rgba(34,100,55,0.58)" />
          <SwayBlade left="88%" height={50} delay={350} rotateBase={4} color="rgba(40,110,58,0.62)" />
        </>
      ) : null}

      <View style={[styles.bloom, styles.bloom1]} />
      <View style={[styles.bloom, styles.bloom2]} />
      <View style={[styles.bloom, styles.bloom3]} />
      {!lite ? (
        <>
          <View style={[styles.bloom, styles.bloom4]} />
          <View style={[styles.bloom, styles.bloom5]} />
        </>
      ) : null}
    </View>
  );
}

function Decor({ id, lite }: { id: ThemeId; lite?: boolean }) {
  if (id === 'sea') return <SeaDecor lite={lite} />;
  if (id === 'desert') return <DesertDecor />;
  return <GrassDecor lite={lite} />;
}

export function ThemeBackground({ theme, lite }: ThemeBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Decor id={theme.id} lite={lite} />
    </View>
  );
}

export function LaserBackground({ lite }: { lite?: boolean } = {}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#04060A', '#0C1018', '#081018', '#05070C']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,40,60,0.08)', 'transparent', 'rgba(40,80,160,0.06)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.laserVignette} />
      <View style={[styles.laserRing, styles.laserRing1]} />
      <View style={[styles.laserRing, styles.laserRing2]} />
      {!lite ? <View style={[styles.laserRing, styles.laserRing3]} /> : null}

      <Twinkle left="14%" top="18%" delay={0} size={2} />
      <Twinkle left="58%" top="16%" delay={600} size={3} />
      <Twinkle left="76%" top="34%" delay={200} size={2} />
      {!lite ? (
        <>
          <Twinkle left="32%" top="28%" delay={300} size={2} />
          <Twinkle left="88%" top="22%" delay={900} size={2} />
          <Twinkle left="22%" top="62%" delay={450} size={2} />
          <Twinkle left="48%" top="70%" delay={700} size={2} />
          <Twinkle left="68%" top="58%" delay={150} size={3} />
        </>
      ) : null}

      <View style={styles.laserFloor} />
      <View style={styles.laserFloorGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  seaCanopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '48%',
  },
  rayBeam: {
    position: 'absolute',
    top: '-5%',
    height: '75%',
    backgroundColor: 'rgba(160, 230, 255, 0.07)',
    transform: [{ skewX: '-14deg' }],
  },
  rayA: { left: '10%', width: 52 },
  rayB: { left: '32%', width: 36, opacity: 0.8 },
  rayC: { left: '52%', width: 44, opacity: 0.65 },
  rayD: { left: '74%', width: 28, opacity: 0.5 },
  caustic: {
    position: 'absolute',
    top: '20%',
    left: '8%',
    width: '40%',
    height: 60,
    borderRadius: 40,
    backgroundColor: 'rgba(120,220,255,0.08)',
    transform: [{ rotate: '-8deg' }],
  },
  caustic2: {
    top: '34%',
    left: '48%',
    width: '42%',
    height: 48,
    transform: [{ rotate: '6deg' }],
  },
  bubble: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(200,245,255,0.55)',
    backgroundColor: 'rgba(200,245,255,0.12)',
  },
  coral: {
    position: 'absolute',
    bottom: '12%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  coralL: {
    left: '4%',
    width: 34,
    height: 70,
    backgroundColor: 'rgba(180,70,90,0.35)',
  },
  coralL2: {
    left: '12%',
    width: 22,
    height: 48,
    backgroundColor: 'rgba(210,100,70,0.28)',
  },
  coralR: {
    right: '8%',
    width: 28,
    height: 62,
    backgroundColor: 'rgba(160,80,140,0.3)',
  },
  coralR2: {
    right: '16%',
    width: 18,
    height: 40,
    backgroundColor: 'rgba(200,90,80,0.25)',
  },
  weedLeaf: {
    position: 'absolute',
    bottom: '14%',
    width: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(18, 100, 78, 0.55)',
  },
  weedA: { left: '24%', height: 100, transform: [{ rotate: '-12deg' }] },
  weedB: { left: '30%', height: 72, backgroundColor: 'rgba(24,120,90,0.45)', transform: [{ rotate: '6deg' }] },
  weedC: { right: '28%', height: 88, transform: [{ rotate: '10deg' }] },
  weedD: { right: '22%', height: 60, backgroundColor: 'rgba(14,90,70,0.5)' },
  weedE: { left: '58%', height: 54, backgroundColor: 'rgba(30,110,85,0.4)', transform: [{ rotate: '-4deg' }] },
  seaBed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '22%',
  },
  sandBar: {
    position: 'absolute',
    left: '-5%',
    right: '-5%',
    bottom: 0,
    height: '11%',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    backgroundColor: 'rgba(40, 70, 70, 0.55)',
  },
  sandSpeck1: {
    position: 'absolute',
    bottom: '6%',
    left: '20%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(180,200,160,0.35)',
  },
  sandSpeck2: {
    position: 'absolute',
    bottom: '4%',
    left: '55%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(200,180,120,0.3)',
  },
  sandSpeck3: {
    position: 'absolute',
    bottom: '7%',
    right: '24%',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(160,190,170,0.28)',
  },

  desertWarmth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  sunAura: {
    position: 'absolute',
    top: '-2%',
    right: '-2%',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 200, 90, 0.18)',
  },
  sunMid: {
    position: 'absolute',
    top: '4%',
    right: '6%',
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(255, 214, 100, 0.35)',
  },
  sunCore: {
    position: 'absolute',
    top: '8%',
    right: '11%',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255, 236, 150, 0.95)',
  },
  heatBand1: {
    position: 'absolute',
    top: '34%',
    left: '6%',
    right: '10%',
    height: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heatBand2: {
    position: 'absolute',
    top: '39%',
    left: '14%',
    right: '18%',
    height: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heatBand3: {
    position: 'absolute',
    top: '43%',
    left: '22%',
    right: '26%',
    height: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rockFar: {
    position: 'absolute',
    bottom: '28%',
    left: '38%',
    width: 70,
    height: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 36,
    backgroundColor: 'rgba(120,70,40,0.28)',
  },
  rockNear: {
    position: 'absolute',
    bottom: '24%',
    right: '30%',
    width: 48,
    height: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(100,60,35,0.32)',
  },
  cactus: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: 'rgba(52, 108, 58, 0.58)',
  },
  cactusTall: {
    left: '10%',
    bottom: '24%',
    width: 18,
    height: 86,
  },
  cactusShort: {
    right: '14%',
    bottom: '22%',
    width: 14,
    height: 58,
  },
  cactusTiny: {
    left: '28%',
    bottom: '22%',
    width: 10,
    height: 34,
    backgroundColor: 'rgba(48, 100, 54, 0.45)',
  },
  armLeft: {
    position: 'absolute',
    left: -18,
    top: 22,
    width: 20,
    height: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 108, 58, 0.58)',
  },
  armRight: {
    position: 'absolute',
    right: -16,
    top: 36,
    width: 18,
    height: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 108, 58, 0.58)',
  },
  armSmall: {
    width: 14,
    top: 16,
  },
  dune: {
    position: 'absolute',
    left: '-14%',
    right: '-14%',
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
  },
  duneFar: {
    bottom: '12%',
    height: '30%',
    backgroundColor: 'rgba(168, 98, 48, 0.42)',
  },
  duneMid: {
    bottom: '2%',
    height: '26%',
    backgroundColor: 'rgba(205, 140, 80, 0.55)',
    transform: [{ translateX: 40 }],
  },
  duneNear: {
    bottom: '-6%',
    height: '18%',
    backgroundColor: 'rgba(236, 190, 130, 0.7)',
    transform: [{ translateX: -32 }],
  },
  sandGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '16%',
  },

  sunSoftHalo: {
    position: 'absolute',
    top: '4%',
    right: '12%',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 245, 190, 0.28)',
  },
  sunSoft: {
    position: 'absolute',
    top: '8%',
    right: '16%',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 250, 210, 0.85)',
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 24,
  },
  cloud1: {
    top: '12%',
    left: '6%',
    width: 92,
    height: 30,
  },
  cloud2: {
    top: '18%',
    right: '8%',
    width: 108,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  cloud3: {
    top: '24%',
    left: '40%',
    width: 70,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  cloudPuff: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 20,
  },
  puffA: { width: 36, height: 28, top: -12, left: 16 },
  puffB: { width: 28, height: 22, top: -8, right: 12 },
  puffC: { width: 40, height: 30, top: -14, left: 20 },
  puffD: { width: 30, height: 24, top: -10, right: 16 },
  hill: {
    position: 'absolute',
    borderTopLeftRadius: 240,
    borderTopRightRadius: 240,
  },
  hillFar: {
    left: '-28%',
    right: '20%',
    bottom: '10%',
    height: '38%',
    backgroundColor: 'rgba(28, 96, 62, 0.48)',
  },
  hillMid: {
    left: '10%',
    right: '-22%',
    bottom: '2%',
    height: '32%',
    backgroundColor: 'rgba(48, 130, 82, 0.55)',
  },
  hillNear: {
    left: '-10%',
    right: '28%',
    bottom: '-8%',
    height: '24%',
    backgroundColor: 'rgba(78, 155, 95, 0.72)',
  },
  blade: {
    position: 'absolute',
    bottom: 0,
    width: 9,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  bloom: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  bloom1: { bottom: '16%', left: '20%', backgroundColor: 'rgba(255,130,160,0.8)' },
  bloom2: { bottom: '20%', left: '62%', backgroundColor: 'rgba(255,210,80,0.75)' },
  bloom3: { bottom: '13%', right: '26%', backgroundColor: 'rgba(255,255,255,0.75)' },
  bloom4: { bottom: '18%', left: '36%', backgroundColor: 'rgba(200,140,255,0.55)' },
  bloom5: { bottom: '22%', right: '40%', backgroundColor: 'rgba(255,160,120,0.65)' },

  twinkle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },

  laserVignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  laserRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,70,90,0.12)',
  },
  laserRing1: {
    width: 180,
    height: 180,
    top: '28%',
    left: '24%',
  },
  laserRing2: {
    width: 280,
    height: 280,
    top: '18%',
    left: '8%',
    borderColor: 'rgba(80,120,200,0.1)',
  },
  laserRing3: {
    width: 120,
    height: 120,
    top: '48%',
    right: '10%',
    borderColor: 'rgba(255,70,90,0.08)',
  },
  laserFloor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '18%',
    backgroundColor: 'rgba(8,12,18,0.55)',
  },
  laserFloorGlow: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    bottom: '10%',
    height: 40,
    borderRadius: 40,
    backgroundColor: 'rgba(255,50,70,0.06)',
  },
});
