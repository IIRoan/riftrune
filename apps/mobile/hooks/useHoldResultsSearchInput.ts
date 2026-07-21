import { useCallback, useEffect, useState } from 'react';
import {
  blurHoldResultsSearchState,
  changeHoldResultsSearchState,
  clearHoldResultsSearchState,
  createHoldResultsSearchState,
  focusHoldResultsSearchState,
  syncHoldResultsSearchState,
} from '@/utils/holdResultsSearchInput';

/**
 * Search field draft that clears on focus without committing an empty query.
 * Results keep using `committed` until the user types (or explicitly clears).
 */
export function useHoldResultsSearchInput(
  committed: string,
  onCommit: (next: string) => void
) {
  const [state, setState] = useState(() => createHoldResultsSearchState(committed));

  useEffect(() => {
    setState((prev) => syncHoldResultsSearchState(prev, committed));
  }, [committed]);

  const onFocus = useCallback(() => {
    setState((prev) => focusHoldResultsSearchState(prev, committed));
  }, [committed]);

  const onBlur = useCallback(() => {
    setState((prev) => blurHoldResultsSearchState(prev));
  }, []);

  const onChangeText = useCallback(
    (text: string) => {
      setState(changeHoldResultsSearchState(text));
      onCommit(text);
    },
    [onCommit]
  );

  const onClear = useCallback(() => {
    setState(clearHoldResultsSearchState());
    onCommit('');
  }, [onCommit]);

  return {
    draft: state.draft,
    onFocus,
    onBlur,
    onChangeText,
    onClear,
  };
}
