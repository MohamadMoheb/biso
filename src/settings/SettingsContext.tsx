import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Difficulty,
  type Settings,
} from './types';

type SettingsContextValue = {
  settings: Settings;
  ready: boolean;
  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setCatCamEnabled: (v: boolean) => void;
  setDifficulty: (v: Difficulty) => void;
  setSessionMinutes: (v: Settings['sessionMinutes']) => void;
  setCreatureCount: (v: number) => void;
  markTipSeen: () => void;
  recordSession: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void loadSettings().then((loaded) => {
      if (!mounted) return;
      setSettings(loaded);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const commit = useCallback((updater: (prev: Settings) => Settings) => {
    setSettings((prev) => {
      const next = updater(prev);
      void saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      ready,
      setSoundEnabled: (soundEnabled) => commit((prev) => ({ ...prev, soundEnabled })),
      setHapticsEnabled: (hapticsEnabled) => commit((prev) => ({ ...prev, hapticsEnabled })),
      setCatCamEnabled: (catCamEnabled) => commit((prev) => ({ ...prev, catCamEnabled })),
      setDifficulty: (difficulty) => commit((prev) => ({ ...prev, difficulty })),
      setSessionMinutes: (sessionMinutes) => commit((prev) => ({ ...prev, sessionMinutes })),
      setCreatureCount: (creatureCount) => commit((prev) => ({ ...prev, creatureCount })),
      markTipSeen: () => commit((prev) => ({ ...prev, tipSeen: true })),
      recordSession: () =>
        commit((prev) => ({
          ...prev,
          sessionsPlayed: prev.sessionsPlayed + 1,
        })),
    }),
    [settings, ready, commit],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
