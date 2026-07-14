import Ionicons from '@react-native-vector-icons/ionicons';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { clearCatSnaps, deleteCatSnap, listCatSnaps, type CatSnap } from '../catcam/storage';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CatCamGallery({ visible, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [snaps, setSnaps] = useState<CatSnap[]>([]);
  const [focus, setFocus] = useState<CatSnap | null>(null);
  const gap = 10;
  const cols = 3;
  const tile = Math.floor((width - 48 - gap * (cols - 1)) / cols);

  const refresh = useCallback(async () => {
    setSnaps(await listCatSnaps());
  }, []);

  useEffect(() => {
    if (visible) void refresh();
  }, [visible, refresh]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Cat Cam</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={26} color="#F7F0E4" />
          </Pressable>
        </View>
        <Text style={styles.sub}>Surprise POV snaps from play sessions</Text>

        {snaps.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No snaps yet</Text>
            <Text style={styles.emptyBody}>
              Turn on Cat Cam on the home screen, then play — the front camera sneaks random silly selfies.
            </Text>
          </View>
        ) : (
          <FlatList
            data={snaps}
            keyExtractor={(item) => item.id}
            numColumns={cols}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={{ gap }}
            ItemSeparatorComponent={() => <View style={{ height: gap }} />}
            renderItem={({ item }) => (
              <Pressable onPress={() => setFocus(item)} style={{ width: tile, height: tile * 1.25 }}>
                <Image source={{ uri: item.uri }} style={styles.thumb} />
              </Pressable>
            )}
          />
        )}

        {snaps.length > 0 ? (
          <Pressable
            style={styles.clearBtn}
            onPress={() => {
              void clearCatSnaps().then(refresh);
              setFocus(null);
            }}
          >
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={!!focus} transparent animationType="fade" onRequestClose={() => setFocus(null)}>
        <View style={styles.focusScrim}>
          {focus ? (
            <>
              <Image source={{ uri: focus.uri }} style={styles.focusImage} resizeMode="contain" />
              <View style={styles.focusRow}>
                <Pressable
                  style={styles.focusAction}
                  onPress={() => {
                    void deleteCatSnap(focus.id).then(() => {
                      setFocus(null);
                      void refresh();
                    });
                  }}
                >
                  <Text style={styles.focusActionText}>Delete</Text>
                </Pressable>
                <Pressable style={styles.focusAction} onPress={() => setFocus(null)}>
                  <Text style={styles.focusActionText}>Close</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </Modal>
    </Modal>
  );
}

const bodyFont = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  default: 'System',
});
const displayFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0C0E',
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: displayFont,
    fontSize: 32,
    fontWeight: '700',
    color: '#F7F0E4',
  },
  sub: {
    marginTop: 6,
    marginBottom: 18,
    fontFamily: bodyFont,
    fontSize: 14,
    color: 'rgba(247,240,228,0.55)',
  },
  grid: {
    paddingBottom: 40,
  },
  thumb: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#1A1E22',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: bodyFont,
    fontSize: 18,
    fontWeight: '700',
    color: '#F7F0E4',
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    fontFamily: bodyFont,
    fontSize: 15,
    color: 'rgba(247,240,228,0.55)',
    textAlign: 'center',
    lineHeight: 22,
  },
  clearBtn: {
    alignSelf: 'center',
    marginBottom: 28,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  clearText: {
    fontFamily: bodyFont,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,120,120,0.9)',
  },
  focusScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: 20,
  },
  focusImage: {
    width: '100%',
    height: '70%',
    borderRadius: 16,
  },
  focusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  focusAction: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  focusActionText: {
    color: '#F7F0E4',
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '600',
  },
});
