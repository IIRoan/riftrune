import { CardsIcon, PencilIcon } from '@/components/icons';
import {
  CatalogSegmentedControl,
  type CatalogSegmentOption,
} from '@/components/catalog/CatalogSegmentedControl';

export type DeckBuilderMiddlePanel = 'catalog' | 'description' | 'stats';

const EDIT_OPTIONS: readonly CatalogSegmentOption<DeckBuilderMiddlePanel>[] = [
  {
    id: 'catalog',
    label: 'Cards',
    accessibilityLabel: 'Show card catalog',
    icon: CardsIcon,
  },
  {
    id: 'description',
    label: 'Desc',
    accessibilityLabel: 'Edit deck description',
    icon: PencilIcon,
  },
];

interface DeckBuilderMiddlePanelToggleProps {
  value: DeckBuilderMiddlePanel;
  onChange: (panel: DeckBuilderMiddlePanel) => void;
  className?: string;
}

export function DeckBuilderMiddlePanelToggle({
  value,
  onChange,
  className,
}: DeckBuilderMiddlePanelToggleProps) {
  return (
    <CatalogSegmentedControl
      value={value}
      onChange={onChange}
      options={EDIT_OPTIONS}
      fill
      className={className}
    />
  );
}
