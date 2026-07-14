export type CatSnap = {
  id: string;
  uri: string;
  createdAt: number;
  mode: 'creatures' | 'laser';
};

const MAX_SNAPS = 40;

/** Lazy-load so a missing FileSystem native module cannot white-screen the home screen. */
async function fs() {
  return import('expo-file-system');
}

type Fs = Awaited<ReturnType<typeof fs>>;

/** index.json is app-owned but still untrusted input — validate every entry. */
function isCatSnap(value: unknown): value is CatSnap {
  if (!value || typeof value !== 'object') return false;
  const snap = value as Record<string, unknown>;
  return (
    typeof snap.id === 'string' &&
    typeof snap.uri === 'string' &&
    typeof snap.createdAt === 'number' &&
    (snap.mode === 'creatures' || snap.mode === 'laser')
  );
}

async function ensureDir(Directory: Fs['Directory'], Paths: Fs['Paths']) {
  const dir = new Directory(Paths.document, 'catcam');
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

async function readMeta(File: Fs['File'], Paths: Fs['Paths']): Promise<CatSnap[]> {
  const meta = new File(Paths.document, 'catcam', 'index.json');
  if (!meta.exists) return [];
  const parsed: unknown = await meta.json();
  return Array.isArray(parsed) ? parsed.filter(isCatSnap) : [];
}

function writeMeta(File: Fs['File'], Paths: Fs['Paths'], snaps: CatSnap[]) {
  const meta = new File(Paths.document, 'catcam', 'index.json');
  if (!meta.exists) {
    meta.create();
  }
  meta.write(JSON.stringify(snaps));
}

/** Delete only files that actually live inside the catcam directory. */
function deleteSnapFile(File: Fs['File'], dirUri: string, uri: string) {
  if (!uri.startsWith(dirUri)) return;
  try {
    new File(uri).delete();
  } catch {
    // Already gone
  }
}

export async function listCatSnaps(): Promise<CatSnap[]> {
  try {
    const { Directory, File, Paths } = await fs();
    const dir = await ensureDir(Directory, Paths);
    const snaps = await readMeta(File, Paths);
    const kept: CatSnap[] = [];
    for (const snap of snaps) {
      try {
        if (snap.uri.startsWith(dir.uri) && new File(snap.uri).exists) kept.push(snap);
      } catch {
        // drop
      }
    }
    if (kept.length !== snaps.length) writeMeta(File, Paths, kept);
    return kept;
  } catch {
    return [];
  }
}

export async function saveCatSnap(
  sourceUri: string,
  mode: CatSnap['mode'],
): Promise<CatSnap | null> {
  try {
    const { Directory, File, Paths } = await fs();
    const dir = await ensureDir(Directory, Paths);
    const id = `snap-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const dest = new File(Paths.document, 'catcam', `${id}.jpg`);
    try {
      await new File(sourceUri).copy(dest);
    } catch {
      await new File(sourceUri).move(dest);
    }
    const snap: CatSnap = { id, uri: dest.uri, createdAt: Date.now(), mode };
    const prev = await readMeta(File, Paths);
    const next = [snap, ...prev].slice(0, MAX_SNAPS);
    const keepIds = new Set(next.map((s) => s.id));
    for (const old of prev) {
      if (!keepIds.has(old.id)) {
        deleteSnapFile(File, dir.uri, old.uri);
      }
    }
    writeMeta(File, Paths, next);
    return snap;
  } catch {
    return null;
  }
}

export async function deleteCatSnap(id: string): Promise<void> {
  try {
    const { Directory, File, Paths } = await fs();
    const dir = await ensureDir(Directory, Paths);
    const snaps = await readMeta(File, Paths);
    const target = snaps.find((s) => s.id === id);
    writeMeta(
      File,
      Paths,
      snaps.filter((s) => s.id !== id),
    );
    if (target) {
      deleteSnapFile(File, dir.uri, target.uri);
    }
  } catch {
    // ignore
  }
}

export async function clearCatSnaps(): Promise<void> {
  try {
    const { Directory, File, Paths } = await fs();
    const dir = await ensureDir(Directory, Paths);
    const snaps = await readMeta(File, Paths);
    writeMeta(File, Paths, []);
    for (const s of snaps) {
      deleteSnapFile(File, dir.uri, s.uri);
    }
  } catch {
    // ignore
  }
}
