import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { Theme, ThemeId } from '../themes';

type ThemeBackgroundProps = {
  theme: Theme;
};

function SeaDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, styles.seaBlob1]} />
      <View style={[styles.blob, styles.seaBlob2]} />
      <View style={[styles.blob, styles.seaBlob3]} />
      <View style={styles.seaFloor} />
    </View>
  );
}

function DesertDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.sun} />
      <View style={[styles.dune, styles.duneBack]} />
      <View style={[styles.dune, styles.duneMid]} />
      <View style={[styles.dune, styles.duneFront]} />
    </View>
  );
}

function GrassDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.sunSoft} />
      <View style={[styles.hill, styles.hillBack]} />
      <View style={[styles.hill, styles.hillMid]} />
      <View style={[styles.hill, styles.hillFront]} />
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
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Decor id={theme.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  seaBlob1: {
    width: 180,
    height: 180,
    top: '18%',
    left: '-8%',
  },
  seaBlob2: {
    width: 120,
    height: 120,
    top: '42%',
    right: '6%',
    backgroundColor: 'rgba(0,255,209,0.12)',
  },
  seaBlob3: {
    width: 90,
    height: 90,
    top: '68%',
    left: '28%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  seaFloor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '18%',
    backgroundColor: 'rgba(4, 56, 74, 0.35)',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
  sun: {
    position: 'absolute',
    top: '10%',
    right: '12%',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255, 214, 120, 0.55)',
  },
  dune: {
    position: 'absolute',
    left: '-10%',
    right: '-10%',
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
  },
  duneBack: {
    bottom: '8%',
    height: '28%',
    backgroundColor: 'rgba(194, 112, 61, 0.35)',
  },
  duneMid: {
    bottom: 0,
    height: '24%',
    backgroundColor: 'rgba(232, 168, 124, 0.40)',
    transform: [{ translateX: 40 }],
  },
  duneFront: {
    bottom: '-4%',
    height: '18%',
    backgroundColor: 'rgba(245, 213, 174, 0.45)',
    transform: [{ translateX: -30 }],
  },
  sunSoft: {
    position: 'absolute',
    top: '8%',
    left: '14%',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 250, 200, 0.35)',
  },
  hill: {
    position: 'absolute',
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
  },
  hillBack: {
    left: '-20%',
    right: '20%',
    bottom: '6%',
    height: '32%',
    backgroundColor: 'rgba(27, 94, 64, 0.35)',
  },
  hillMid: {
    left: '15%',
    right: '-15%',
    bottom: 0,
    height: '26%',
    backgroundColor: 'rgba(64, 145, 108, 0.40)',
  },
  hillFront: {
    left: '-5%',
    right: '30%',
    bottom: '-6%',
    height: '20%',
    backgroundColor: 'rgba(149, 213, 178, 0.45)',
  },
});
