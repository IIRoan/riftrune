import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';
import {
  DEFAULT_GRID_CARD_SIZE,
  isGridCardSize,
  type GridCardSize,
} from '@/lib/grid-columns';

export type ThemeType = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';
export type { GridCardSize };

type Settings = {
  theme: ThemeType;
  accentColor?: string;
  defaultLayout: 'grid' | 'list';
  gridCardSize: GridCardSize;
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  defaultLayout: 'list',
  gridCardSize: DEFAULT_GRID_CARD_SIZE,
};

const STORAGE_KEY = 'riftbound_settings';

function parseSettings(raw: string): Settings {
  const parsed = JSON.parse(raw) as Partial<Settings>;
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    gridCardSize: isGridCardSize(parsed.gridCardSize)
      ? parsed.gridCardSize
      : DEFAULT_GRID_CARD_SIZE,
  };
}

type ThemeContextValue = {
  theme: ThemeType;
  actualTheme: ColorScheme;
  accentColor?: string;
  defaultLayout: 'grid' | 'list';
  gridCardSize: GridCardSize;
  setTheme: (theme: ThemeType) => void;
  setAccentColor: (color: string) => void;
  setDefaultLayout: (layout: 'grid' | 'list') => void;
  setGridCardSize: (size: GridCardSize) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = (useColorScheme() as ColorScheme) || 'dark';
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setSettings(parseSettings(raw));
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Settings) => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const actualTheme: ColorScheme =
    settings.theme === 'system' ? systemScheme : settings.theme;

  useEffect(() => {
    Uniwind.setTheme(settings.theme === 'system' ? 'system' : settings.theme);
  }, [settings.theme]);

  // Archive palette uses fixed chartreuse accent from global.css — do not override.

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: settings.theme,
      actualTheme,
      accentColor: settings.accentColor,
      defaultLayout: settings.defaultLayout,
      gridCardSize: settings.gridCardSize,
      setTheme: (theme) => {
        void persist({ ...settings, theme });
      },
      setAccentColor: (accentColor) => {
        void persist({ ...settings, accentColor });
      },
      setDefaultLayout: (defaultLayout) => {
        void persist({ ...settings, defaultLayout });
      },
      setGridCardSize: (gridCardSize) => {
        void persist({ ...settings, gridCardSize });
      },
    }),
    [settings, actualTheme, persist]
  );

  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
