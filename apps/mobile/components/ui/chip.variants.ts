import { cva } from 'class-variance-authority';

export const chipVariants = cva(
  'flex w-fit shrink-0 flex-row items-center justify-center gap-1 self-start overflow-hidden whitespace-nowrap rounded-full px-2.5 py-1.5 font-medium text-xs',
  {
    variants: {
      variant: {
        default: 'bg-primary active:bg-primary/80',
        secondary: 'bg-secondary active:bg-secondary/50',
        destructive:
          'bg-destructive active:bg-destructive/80 dark:bg-destructive/60',
        outline:
          'border border-border bg-card active:bg-accent/90 dark:border-input dark:bg-input/30 dark:active:bg-input/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const chipTextVariants = cva(
  'whitespace-nowrap font-semibold text-sm leading-tight',
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        secondary: 'text-secondary-foreground',
        destructive: 'text-white',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const chipIconVariants = cva('size-4', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-white',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
