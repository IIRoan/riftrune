import { Heading } from '@/components/ui/heading';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/** Standard screen title + optional subtitle, shared across top-level tab screens. */
export function ScreenHeader({ title, subtitle, className }: ScreenHeaderProps) {
  return (
    <Stack gap="xs" className={cn('mb-2', className)}>
      <Heading level="3" className="text-foreground">
        {title}
      </Heading>
      {subtitle ? (
        <Text className="font-mono text-[13px] text-muted-foreground">{subtitle}</Text>
      ) : null}
    </Stack>
  );
}
