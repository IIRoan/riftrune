import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  type NativeSyntheticEvent,
  type TextInput,
  type TextInputKeyPressEventData,
  type TextInputProps,
} from 'react-native';
import {
  InputAddon,
  InputAddonButton,
  InputAddonButtonIcon,
} from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { XIcon } from '@/components/icons';
import { useHoldResultsSearchInput } from '@/hooks/useHoldResultsSearchInput';
import { useLatestRef } from '@/hooks/useLatestRef';
import { useWebSlashFocus } from '@/hooks/useWebSlashFocus';
import { isSlashShortcutTextChange } from '@/utils/webSlashFocus';

interface SearchBarProps extends Pick<TextInputProps, 'onSubmitEditing' | 'autoFocus'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
  /** Web: show `/` hint and bind slash-to-focus / slash-to-clear. Defaults to true. */
  enableSlashFocus?: boolean;
}

/**
 * Catalog search field.
 * - Focus (click or `/` on web) clears the draft without committing — results stay until typing or clear.
 * - Typing a query then `/` clears the field only (keeps current results until a new query).
 * - Explicit clear (X) commits empty and resets results.
 */
export function SearchBar({
  value,
  onChangeText,
  onClear,
  isLoading = false,
  placeholder = 'Search cards…',
  onSubmitEditing,
  autoFocus,
  enableSlashFocus = true,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const searchFocusedRef = useRef(false);
  const {
    draft,
    onFocus: holdOnFocus,
    onBlur: holdOnBlur,
    onChangeText: onDraftChange,
    onClear: clearDraftAndCommit,
    onHoldClear,
  } = useHoldResultsSearchInput(value, onChangeText);

  const draftRef = useLatestRef(draft);

  const clearSearch = useCallback(() => {
    clearDraftAndCommit();
    onClear();
  }, [clearDraftAndCommit, onClear]);

  const onFocus = useCallback(() => {
    searchFocusedRef.current = true;
    holdOnFocus();
  }, [holdOnFocus]);

  const onBlur = useCallback(() => {
    searchFocusedRef.current = false;
    holdOnBlur();
  }, [holdOnBlur]);

  /** Clear draft via `/` without resetting committed search results. */
  const clearDraftKeepResults = useCallback(() => {
    if (draftRef.current.length === 0) return;
    onHoldClear();
  }, [draftRef, onHoldClear]);

  useWebSlashFocus(inputRef, {
    enabled: enableSlashFocus,
    searchFocusedRef,
    onClearWhileFocused: clearDraftKeepResults,
  });

  /** Reliable path: RN-web often commits `ahri/` before window preventDefault. */
  const handleChangeText = useCallback(
    (text: string) => {
      if (enableSlashFocus && Platform.OS === 'web' && isSlashShortcutTextChange(text)) {
        // "ahri" + "/" → empty draft, keep prior committed results.
        onHoldClear();
        return;
      }
      onDraftChange(text);
    },
    [enableSlashFocus, onDraftChange, onHoldClear]
  );

  const handleKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (!enableSlashFocus || Platform.OS !== 'web') return;
      if (event.nativeEvent.key !== '/') return;
      (event as unknown as { preventDefault?: () => void }).preventDefault?.();
      clearDraftKeepResults();
    },
    [clearDraftKeepResults, enableSlashFocus]
  );

  const showClear = (draft.length > 0 || value.length > 0) && !isLoading;

  return (
    <SearchInput
      ref={inputRef}
      value={draft}
      onChangeText={handleChangeText}
      onKeyPress={handleKeyPress}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      returnKeyType="search"
      autoCapitalize="none"
      autoCorrect={false}
      onSubmitEditing={onSubmitEditing}
      autoFocus={autoFocus}
      shortcutHint={enableSlashFocus ? '/' : undefined}
    >
      {isLoading ? (
        <InputAddon align="inline-end">
          <ActivityIndicator size="small" className="accent-primary" />
        </InputAddon>
      ) : null}
      {showClear ? (
        <InputAddon align="inline-end">
          <InputAddonButton
            accessibilityLabel="Clear search"
            onPress={clearSearch}
            size="sm"
            variant="ghost"
          >
            <InputAddonButtonIcon>
              <XIcon />
            </InputAddonButtonIcon>
          </InputAddonButton>
        </InputAddon>
      ) : null}
    </SearchInput>
  );
}
