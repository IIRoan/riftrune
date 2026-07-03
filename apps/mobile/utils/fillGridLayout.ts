export type FillGridOptions = {
  minItemWidth: number;
  maxColumns: number;
  gap: number;
};

export function computeFillGrid(contentWidth: number, options: FillGridOptions) {
  const { minItemWidth, maxColumns, gap } = options;
  const columns = Math.max(
    1,
    Math.min(maxColumns, Math.floor((contentWidth + gap) / (minItemWidth + gap)))
  );
  const itemWidth = (contentWidth - gap * (columns - 1)) / columns;
  return { columns, itemWidth, gap };
}
