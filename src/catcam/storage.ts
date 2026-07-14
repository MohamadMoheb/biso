import * as FileSystem from 'expo-file-system/legacy';

export type CatSnap = {
  id: string;
  uri: string;
  createdAt: number;
  mode: 'creatures' | 'laser';
};

const DIR = `${FileSystem.documentDirectory ?? ''}catcam/`;
const META_PATH = `${DIR}index.json`;
const MAX_SNAPS = 40;

async function ensureDir(): Promise<boolean> {
  if (!FileSystem.documentDirectory) return false;
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
  return true;
}

async function readMeta(): Promise<CatSnap[]> {
  try {
    if (!(await ensureDir())) return [];
    const info = await FileSystem.getInfoAsync(META_PATH);
    if (!info.exists) return [];
    const text = await FileSystem.readAsStringAsync(META_PATH);
    const parsed = JSON.parse(text) as CatSnap[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeMeta(snaps: CatSnap[]) {
  if (!(await ensureDir())) return;
  await FileSystem.writeAsStringAsync(META_PATH, JSON.stringify(snaps));
}

export async function listCatSnaps(): Promise<CatSnap[]> {
  if (!(await ensureDir())) return [];
  const snaps = await readMeta();
  const kept: CatSnap[] = [];
  for (const snap of snaps) {
    const info = await FileSystem.getInfoAsync(snap.uri);
    if (info.exists) kept.push(snap);
  }
  if (kept.length !== snaps.length) await writeMeta(kept);
  return kept;
}

export async function saveCatSnap(
  sourceUri: string,
  mode: CatSnap['mode'],
): Promise<CatSnap | null> {
  if (!(await ensureDir())) return null;
  const id = `snap-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  const dest = `${DIR}${id}.jpg`;
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
  } catch {
    try {
      await FileSystem.moveAsync({ from: sourceUri, to: dest });
    } catch {
      return null;
    }
  }
  const snap: CatSnap = { id, uri: dest, createdAt: Date.now(), mode };
  const prev = await readMeta();
  const next = [snap, ...prev].slice(0, MAX_SNAPS);
  const keepIds = new Set(next.map((s) => s.id));
  for (const old of prev) {
    if (!keepIds.has(old.id)) {
      void FileSystem.deleteAsync(old.uri, { idempotent: true });
    }
  }
  await writeMeta(next);
  return snap;
}

export async function deleteCatSnap(id: string): Promise<void> {
  const snaps = await readMeta();
  const target = snaps.find((s) => s.id === id);
  await writeMeta(snaps.filter((s) => s.id !== id));
  if (target) {
    await FileSystem.deleteAsync(target.uri, { idempotent: true }).catch(() => undefined);
  }
}

export async function clearCatSnaps(): Promise<void> {
  const snaps = await readMeta();
  await writeMeta([]);
  await Promise.all(
    snaps.map((s) => FileSystem.deleteAsync(s.uri, { idempotent: true }).catch(() => undefined)),
  );
}
