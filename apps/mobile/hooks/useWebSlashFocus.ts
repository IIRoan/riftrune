import { useEffect, type RefObject } from 'react';
import { Platform, type TextInput } from 'react-native';
import { resolveSlashSearchAction } from '@/utils/webSlashFocus';

type UseWebSlashFocusOptions = {
  enabled?: boolean;
  /** True while the bound search field owns focus. */
  searchFocusedRef: RefObject<boolean>;
  /** Clear draft + committed query when `/` is pressed while focused. */
  onClearWhileFocused: () => void;
};

/** Web `/` capture: outside fields focuses search; focused clears (RN-web inserts `/` eagerly). */
export function useWebSlashFocus(
  inputRef: RefObject<TextInput | null>,
  { enabled = true, searchFocusedRef, onClearWhileFocused }: UseWebSlashFocusOptions
) {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      const action = resolveSlashSearchAction(event, searchFocusedRef.current);
      if (!action) return;

      event.preventDefault();
      event.stopPropagation();
      if (action === 'clear') {
        onClearWhileFocused();
        return;
      }

      inputRef.current?.focus();
    };

    // Capture so we run before RN-web's input handler when possible.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [enabled, inputRef, onClearWhileFocused, searchFocusedRef]);
}
