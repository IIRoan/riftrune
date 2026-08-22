import { useState } from 'react';

/** Detect value change across renders without mutating a ref during render (adjust-state-while-rendering). */
export function useValueChangeFlag<T>(value: T): boolean {
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    return true;
  }
  return false;
}
