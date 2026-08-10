import { CardsIcon, PencilIcon } from '@/components/icons';
import {
  CatalogSegmentedControl,
  type CatalogSegmentOption,
} from '@/components/catalog/CatalogSegmentedControl';

export type DeckBuilderMiddlePanel = 'catalog' | 'description';

const OPTIONS: readonly CatalogSegmentOption<DeckBuilderMiddlePanel>[] = [
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

/** Left-rail control that swaps the middle builder column — same chrome as catalog segments. */
export function DeckBuilderMiddlePanelToggle({
  value,
  onChange,
  className,
}: DeckBuilderMiddlePanelToggleProps) {
  return (
    <CatalogSegmentedControl
      value={value}
      onChange={onChange}
      options={OPTIONS}
      fill
      className={className}
    />
  );
}
