import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatestRef } from '@/hooks/useLatestRef';
import {
  blurFocusedTextDraftState,
  changeFocusedTextDraftState,
  createFocusedTextDraftState,
  focusFocusedTextDraftState,
  shouldCommitFocusedTextDraft,
  syncFocusedTextDraftState,
} from '@/utils/focusedTextDraft';

/** Debounce parent commits while typing so deck persist/query cache cannot thrash. */
export const FOCUSED_TEXT_DRAFT_COMMIT_MS = 300;

type UseFocusedTextDraftOptions = {
  /** Transform each keystroke before draft/commit (e.g. markdown clamp). */
  transform?: (text: string) => string;
  /** Parent commit debounce. `0` commits every change. */
  commitMs?: number;
};

/** Local draft while focused; ignore parent `value` until blur so carets don't jump. */
export function useFocusedTextDraft(
  value: string,
  onChange: (next: string) => void,
  options?: UseFocusedTextDraftOptions
) {
  const transform = options?.transform;
  const commitMs = options?.commitMs ?? FOCUSED_TEXT_DRAFT_COMMIT_MS;

  const [state, setState] = useState(() => createFocusedTextDraftState(value));
  const stateRef = useLatestRef(state);
  const onChangeRef = useLatestRef(onChange);
  const transformRef = useLatestRef(transform);

  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCommitRef = useRef<string | null>(null);

  const flushCommit = useCallback(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    const pending = pendingCommitRef.current;
    pendingCommitRef.current = null;
    if (pending == null) return;
    onChangeRef.current(pending);
  }, [onChangeRef]);

  const scheduleCommit = useCallback(
    (next: string) => {
      pendingCommitRef.current = next;
      if (commitMs <= 0) {
        flushCommit();
        return;
      }
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = setTimeout(() => {
        commitTimerRef.current = null;
        flushCommit();
      }, commitMs);
    },
    [commitMs, flushCommit]
  );

  useEffect(() => {
    setState((prev) => syncFocusedTextDraftState(prev, value));
  }, [value]);

  useEffect(() => {
    return () => {
      // Unmount: flush any debounced parent write so navigations keep edits.
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      const pending = pendingCommitRef.current;
      pendingCommitRef.current = null;
      if (pending != null) onChangeRef.current(pending);
    };
  }, [onChangeRef]);

  const onFocus = useCallback(() => {
    setState((prev) => focusFocusedTextDraftState(prev));
  }, []);

  const onBlur = useCallback(() => {
    setState((prev) => blurFocusedTextDraftState(prev));
    flushCommit();
  }, [flushCommit]);

  const onChangeText = useCallback(
    (text: string) => {
      const next = transformRef.current ? transformRef.current(text) : text;
      const previous = stateRef.current.draft;
      setState((prev) => changeFocusedTextDraftState(prev, next));
      if (!shouldCommitFocusedTextDraft(previous, next)) return;
      scheduleCommit(next);
    },
    [scheduleCommit, stateRef, transformRef]
  );

  return {
    value: state.draft,
    onFocus,
    onBlur,
    onChangeText,
    flush: flushCommit,
  };
}
