import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type AppSheetMode = 'sheet' | 'dialog';

export type AppSheetContextValue = {
  mode: AppSheetMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissible: boolean;
  presence: SharedValue<number> | null;
  reduceMotion: boolean;
};

export const AppSheetContext = createContext<AppSheetContextValue | null>(null);

export function useAppSheetContext() {
  const ctx = useContext(AppSheetContext);
  if (!ctx) {
    throw new Error('AppSheet components must be used within AppSheet');
  }
  return ctx;
}
