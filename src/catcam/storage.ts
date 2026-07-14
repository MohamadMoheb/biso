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

async function ensureDir(
  Directory: (typeof import('expo-file-system'))['Directory'],
  Paths: (typeof import('expo-file-system'))['Paths'],
) {
  const dir = new Directory(Paths.document, 'catcam');
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

async function readMeta(
  File: (typeof import('expo-file-system'))['File'],
  Paths: (typeof import('expo-file-system'))['Paths'],
): Promise<CatSnap[]> {
  const meta = new File(Paths.document, 'catcam', 'index.json');
  if (!meta.exists) return [];
  const parsed = await meta.json();
  return Array.isArray(parsed) ? (parsed as CatSnap[]) : [];
}

function writeMeta(
  File: (typeof import('expo-file-system'))['File'],
  Paths: (typeof import('expo-file-system'))['Paths'],
  snaps: CatSnap[],
) {
  const meta = new File(Paths.document, 'catcam', 'index.json');
  if (!meta.exists) {
    meta.create();
  }
  meta.write(JSON.stringify(snaps));
}

export async function listCatSnaps(): Promise<CatSnap[]> {
  try {
    const { Directory, File, Paths } = await fs();
    await ensureDir(Directory, Paths);
    const snaps = await readMeta(File, Paths);
    const kept: CatSnap[] = [];
    for (const snap of snaps) {
      try {
        if (new File(snap.uri).exists) kept.push(snap);
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
    await ensureDir(Directory, Paths);
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
        try {
          new File(old.uri).delete();
        } catch {
          // ignore
        }
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
    await ensureDir(Directory, Paths);
    const snaps = await readMeta(File, Paths);
    const target = snaps.find((s) => s.id === id);
    writeMeta(
      File,
      Paths,
      snaps.filter((s) => s.id !== id),
    );
    if (target) {
      try {
        new File(target.uri).delete();
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

export async function clearCatSnaps(): Promise<void> {
  try {
    const { Directory, File, Paths } = await fs();
    await ensureDir(Directory, Paths);
    const snaps = await readMeta(File, Paths);
    writeMeta(File, Paths, []);
    for (const s of snaps) {
      try {
        new File(s.uri).delete();
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}
