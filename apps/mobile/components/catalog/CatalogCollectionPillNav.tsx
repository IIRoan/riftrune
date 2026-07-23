import { CardholderIcon, CardsIcon } from '@/components/icons';
import { PillNav, type PillNavItem } from '@/components/shell/FloatingPillNav';
import type { CatalogCollectionFilter } from '@/constants/catalogFilters';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

const NAV_ITEMS: readonly PillNavItem<CatalogCollectionFilter>[] = [
  {
    id: 'all',
    label: 'All',
    accessibilityLabel: 'All cards',
    icon: CardsIcon,
  },
  {
    id: 'owned',
    label: 'Owned',
    accessibilityLabel: 'Owned cards',
    icon: CardholderIcon,
  },
];

interface CatalogCollectionPillNavProps {
  value: CatalogCollectionFilter;
  onChange: (value: CatalogCollectionFilter) => void;
  className?: string;
}

/** Catalog All / Owned switch — inline compact control for the cards toolbar. */
export function CatalogCollectionPillNav({
  value,
  onChange,
  className,
}: CatalogCollectionPillNavProps) {
  const isMobile = useMobileLayout();

  return (
    <PillNav
      items={NAV_ITEMS}
      value={value}
      onChange={onChange}
      compact
      iconOnly={isMobile}
      className={cn('h-11 shrink-0', className)}
    />
  );
}
