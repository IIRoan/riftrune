import {
  FLOATING_PILL_NAV_CLEARANCE,
  FloatingPillNav,
  type FloatingPillNavItem,
} from '@/components/shell/FloatingPillNav';
import type { CatalogCollectionFilter } from '@/constants/catalogFilters';

export { FLOATING_PILL_NAV_CLEARANCE as CATALOG_COLLECTION_PILL_CLEARANCE };

const NAV_ITEMS: readonly FloatingPillNavItem<CatalogCollectionFilter>[] = [
  {
    id: 'all',
    label: 'All',
    accessibilityLabel: 'All cards',
    icon: 'grid-outline',
    iconActive: 'grid',
  },
  {
    id: 'owned',
    label: 'Owned',
    accessibilityLabel: 'Owned cards',
    icon: 'archive-outline',
    iconActive: 'archive',
  },
];

interface CatalogCollectionPillNavProps {
  value: CatalogCollectionFilter;
  onChange: (value: CatalogCollectionFilter) => void;
}

/** Catalog All / Owned — same FloatingPillNav as decks Mine / Browse. */
export function CatalogCollectionPillNav({ value, onChange }: CatalogCollectionPillNavProps) {
  return <FloatingPillNav items={NAV_ITEMS} value={value} onChange={onChange} />;
}
