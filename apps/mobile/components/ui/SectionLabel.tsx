import type { TextProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

interface SectionLabelProps extends TextProps {
  children: string;
}

/** Uppercase tracked label matching modal section headers. */
export function SectionLabel({ children, className, ...rest }: SectionLabelProps) {
  return (
    <Text
      className={cn(
        'mb-2 text-[10px] font-semibold uppercase tracking-[1.6px] text-muted-foreground',
        className
      )}
      {...rest}
    >
      {children}
    </Text>
  );
}
