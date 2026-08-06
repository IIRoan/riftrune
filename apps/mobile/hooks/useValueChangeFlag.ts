import { useState } from 'react';

/**
 * Detect when `value` changes across renders without mutating a ref during render.
 * On the render where the value changed, returns true and schedules the previous
 * snapshot update (React's "adjust state while rendering" pattern).
 */
export function useValueChangeFlag<T>(value: T): boolean {
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    return true;
  }
  return false;
}
