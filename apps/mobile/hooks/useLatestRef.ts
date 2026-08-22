import { useLayoutEffect, useRef } from 'react';

/** Ref to latest value without writing during render (stable callbacks that read fresh props). */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
