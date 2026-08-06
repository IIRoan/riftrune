import { useLayoutEffect, useRef } from 'react';

/**
 * Keep a ref pointed at the latest value without writing during render.
 * Use for stable callback wrappers that must read fresh props/state.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
