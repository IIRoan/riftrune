import { useMemo } from 'react';
import { useScreenLayout } from '@/components/shell/ScreenLayout';
import {
  computeFillGrid,
  type FillGridOptions,
} from '@/utils/fillGridLayout';

export function useFillGridLayout(options: FillGridOptions) {
  const { contentWidth } = useScreenLayout();

  return useMemo(
    () => computeFillGrid(contentWidth, options),
    [contentWidth, options.minItemWidth, options.maxColumns, options.gap]
  );
}
