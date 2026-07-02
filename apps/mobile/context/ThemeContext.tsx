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

export type ThemeType = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

const DEFAULT_PRIMARY = '#c89b3c';

type Settings = {
  theme: ThemeType;
  accentColor?: string;
  defaultLayout: 'grid' | 'list';
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  defaultLayout: 'grid',
};

const STORAGE_KEY = 'riftbound_settings';

type ThemeContextValue = {
  theme: ThemeType;
  actualTheme: ColorScheme;
  accentColor?: string;
  defaultLayout: 'grid' | 'list';
  setTheme: (theme: ThemeType) => void;
  setAccentColor: (color: string) => void;
  setDefaultLayout: (layout: 'grid' | 'list') => void;
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
          const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
          setSettings(parsed);
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

  useEffect(() => {
    const accent = settings.accentColor ?? DEFAULT_PRIMARY;
    const vars = { '--primary': accent, '--ring': accent } as const;
    Uniwind.updateCSSVariables('light', vars);
    Uniwind.updateCSSVariables('dark', vars);
  }, [settings.accentColor]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: settings.theme,
      actualTheme,
      accentColor: settings.accentColor,
      defaultLayout: settings.defaultLayout,
      setTheme: (theme) => {
        void persist({ ...settings, theme });
      },
      setAccentColor: (accentColor) => {
        void persist({ ...settings, accentColor });
      },
      setDefaultLayout: (defaultLayout) => {
        void persist({ ...settings, defaultLayout });
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
