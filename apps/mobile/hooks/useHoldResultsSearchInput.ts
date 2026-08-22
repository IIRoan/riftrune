import { useCallback, useEffect, useState } from 'react';
import {
  blurHoldResultsSearchState,
  changeHoldResultsSearchState,
  clearHoldResultsSearchState,
  createHoldResultsSearchState,
  focusHoldResultsSearchState,
  syncHoldResultsSearchState,
} from '@/utils/holdResultsSearchInput';

/** Clears draft on focus without committing empty; results keep `committed` until type/clear. */
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

  /** Clear the visible draft without committing — results keep using `committed`. */
  const onHoldClear = useCallback(() => {
    setState((prev) => focusHoldResultsSearchState(prev, committed));
  }, [committed]);

  return {
    draft: state.draft,
    onFocus,
    onBlur,
    onChangeText,
    onClear,
    onHoldClear,
  };
}
