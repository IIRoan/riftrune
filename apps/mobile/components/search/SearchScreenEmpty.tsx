import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ThemedIcon, type LucideIcon } from '@/components/icons';

export function SearchEmptyState({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <Empty className="mt-14 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-1 size-16">
          <ThemedIcon icon={icon} size={32} color="muted-foreground" />
        </EmptyMedia>
        <EmptyTitle className="text-lg">{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
    </Empty>
  );
}
