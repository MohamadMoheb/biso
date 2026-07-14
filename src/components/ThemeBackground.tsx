import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { Theme, ThemeId } from '../themes';

type ThemeBackgroundProps = {
  theme: Theme;
};

function SeaDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['rgba(180,240,255,0.28)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={styles.seaSurfaceGlow}
      />
      <View style={[styles.ray, styles.ray1]} />
      <View style={[styles.ray, styles.ray2]} />
      <View style={[styles.ray, styles.ray3]} />

      <View style={[styles.bubble, styles.b1]} />
      <View style={[styles.bubble, styles.b2]} />
      <View style={[styles.bubble, styles.b3]} />
      <View style={[styles.bubble, styles.b4]} />
      <View style={[styles.bubble, styles.b5]} />

      <View style={[styles.seaweed, styles.weed1]} />
      <View style={[styles.seaweed, styles.weed2]} />
      <View style={[styles.seaweed, styles.weed3]} />
      <View style={[styles.seaweed, styles.weed4]} />

      <View style={styles.seaFloor} />
      <View style={styles.seaFloorRipple} />
    </View>
  );
}

function DesertDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#F7C98A', '#F0A85C', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.sunCore} />
      <View style={styles.sunHalo} />
      <View style={styles.sunRim} />

      <View style={[styles.heat, styles.heat1]} />
      <View style={[styles.heat, styles.heat2]} />

      <View style={[styles.cactus, styles.cactusLeft]}>
        <View style={styles.cactusArmL} />
        <View style={styles.cactusArmR} />
      </View>
      <View style={[styles.cactus, styles.cactusRight]}>
        <View style={[styles.cactusArmL, styles.cactusArmSmall]} />
      </View>

      <View style={[styles.dune, styles.duneBack]} />
      <View style={[styles.dune, styles.duneMid]} />
      <View style={[styles.dune, styles.duneFront]} />
      <View style={styles.sandGrain} />
    </View>
  );
}

function GrassDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#9FD6F0', '#B7E0C8', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cloudA} />
      <View style={styles.cloudB} />
      <View style={styles.cloudC} />

      <View style={styles.sunSoft} />
      <View style={styles.sunSoftCore} />

      <View style={[styles.hill, styles.hillBack]} />
      <View style={[styles.hill, styles.hillMid]} />
      <View style={[styles.hill, styles.hillFront]} />

      <View style={[styles.blade, styles.blade1]} />
      <View style={[styles.blade, styles.blade2]} />
      <View style={[styles.blade, styles.blade3]} />
      <View style={[styles.blade, styles.blade4]} />
      <View style={[styles.blade, styles.blade5]} />
      <View style={[styles.blade, styles.blade6]} />

      <View style={[styles.flower, styles.flower1]} />
      <View style={[styles.flower, styles.flower2]} />
      <View style={[styles.flower, styles.flower3]} />
    </View>
  );
}

function Decor({ id }: { id: ThemeId }) {
  if (id === 'sea') return <SeaDecor />;
  if (id === 'desert') return <DesertDecor />;
  return <GrassDecor />;
}

export function ThemeBackground({ theme }: ThemeBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Decor id={theme.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  seaSurfaceGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '40%',
  },
  ray: {
    position: 'absolute',
    top: 0,
    width: 46,
    height: '70%',
    backgroundColor: 'rgba(180, 240, 255, 0.08)',
    transform: [{ skewX: '-12deg' }],
  },
  ray1: { left: '18%' },
  ray2: { left: '38%', width: 34, opacity: 0.7 },
  ray3: { left: '58%', width: 28, opacity: 0.55 },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(200,245,255,0.45)',
    backgroundColor: 'rgba(200,245,255,0.12)',
  },
  b1: { width: 18, height: 18, top: '28%', left: '14%' },
  b2: { width: 12, height: 12, top: '46%', left: '72%' },
  b3: { width: 22, height: 22, top: '58%', left: '24%' },
  b4: { width: 10, height: 10, top: '34%', left: '84%' },
  b5: { width: 14, height: 14, top: '72%', left: '60%' },
  seaweed: {
    position: 'absolute',
    bottom: '10%',
    width: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(20, 90, 70, 0.55)',
  },
  weed1: { left: '8%', height: 90, transform: [{ rotate: '-8deg' }] },
  weed2: { left: '18%', height: 64, backgroundColor: 'rgba(28, 110, 80, 0.45)' },
  weed3: { right: '16%', height: 78, transform: [{ rotate: '10deg' }] },
  weed4: { right: '8%', height: 52, backgroundColor: 'rgba(18, 80, 66, 0.5)' },
  seaFloor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '16%',
    backgroundColor: 'rgba(8, 40, 58, 0.55)',
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
  },
  seaFloorRipple: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    bottom: '12%',
    height: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(120, 190, 200, 0.12)',
  },

  sunCore: {
    position: 'absolute',
    top: '7%',
    right: '10%',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255, 230, 140, 0.95)',
  },
  sunHalo: {
    position: 'absolute',
    top: '3%',
    right: '5%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 210, 100, 0.28)',
  },
  sunRim: {
    position: 'absolute',
    top: '0%',
    right: '1%',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 190, 80, 0.12)',
  },
  heat: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    height: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heat1: { top: '36%' },
  heat2: { top: '42%', opacity: 0.7, transform: [{ scaleX: 0.85 }] },
  cactus: {
    position: 'absolute',
    bottom: '22%',
    width: 18,
    height: 70,
    borderRadius: 10,
    backgroundColor: 'rgba(62, 110, 54, 0.55)',
  },
  cactusLeft: { left: '12%' },
  cactusRight: { right: '18%', height: 52, width: 14 },
  cactusArmL: {
    position: 'absolute',
    left: -16,
    top: 18,
    width: 18,
    height: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(62, 110, 54, 0.55)',
  },
  cactusArmR: {
    position: 'absolute',
    right: -14,
    top: 28,
    width: 16,
    height: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(62, 110, 54, 0.55)',
  },
  cactusArmSmall: {
    width: 14,
    top: 14,
  },
  dune: {
    position: 'absolute',
    left: '-12%',
    right: '-12%',
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
  },
  duneBack: {
    bottom: '10%',
    height: '30%',
    backgroundColor: 'rgba(176, 110, 58, 0.45)',
  },
  duneMid: {
    bottom: 0,
    height: '26%',
    backgroundColor: 'rgba(210, 150, 95, 0.55)',
    transform: [{ translateX: 36 }],
  },
  duneFront: {
    bottom: '-5%',
    height: '18%',
    backgroundColor: 'rgba(236, 196, 140, 0.65)',
    transform: [{ translateX: -28 }],
  },
  sandGrain: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '8%',
    backgroundColor: 'rgba(245, 220, 170, 0.25)',
  },

  cloudA: {
    position: 'absolute',
    top: '10%',
    left: '8%',
    width: 86,
    height: 28,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  cloudB: {
    position: 'absolute',
    top: '16%',
    right: '12%',
    width: 110,
    height: 34,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  cloudC: {
    position: 'absolute',
    top: '22%',
    left: '42%',
    width: 64,
    height: 22,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  sunSoft: {
    position: 'absolute',
    top: '6%',
    right: '18%',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 245, 180, 0.35)',
  },
  sunSoftCore: {
    position: 'absolute',
    top: '9%',
    right: '21%',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 248, 200, 0.7)',
  },
  hill: {
    position: 'absolute',
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
  },
  hillBack: {
    left: '-25%',
    right: '18%',
    bottom: '8%',
    height: '36%',
    backgroundColor: 'rgba(36, 110, 70, 0.5)',
  },
  hillMid: {
    left: '12%',
    right: '-20%',
    bottom: 0,
    height: '30%',
    backgroundColor: 'rgba(58, 140, 90, 0.55)',
  },
  hillFront: {
    left: '-8%',
    right: '25%',
    bottom: '-8%',
    height: '22%',
    backgroundColor: 'rgba(96, 170, 110, 0.7)',
  },
  blade: {
    position: 'absolute',
    bottom: 0,
    width: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'rgba(40, 110, 60, 0.55)',
  },
  blade1: { left: '6%', height: 44, transform: [{ rotate: '-12deg' }] },
  blade2: { left: '12%', height: 34, transform: [{ rotate: '8deg' }] },
  blade3: { left: '48%', height: 40, transform: [{ rotate: '-6deg' }] },
  blade4: { left: '55%', height: 28 },
  blade5: { right: '10%', height: 42, transform: [{ rotate: '10deg' }] },
  blade6: { right: '16%', height: 30, transform: [{ rotate: '-8deg' }] },
  flower: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  flower1: {
    bottom: '14%',
    left: '22%',
    backgroundColor: 'rgba(255, 140, 170, 0.75)',
  },
  flower2: {
    bottom: '18%',
    left: '68%',
    backgroundColor: 'rgba(255, 210, 90, 0.7)',
  },
  flower3: {
    bottom: '12%',
    right: '28%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
