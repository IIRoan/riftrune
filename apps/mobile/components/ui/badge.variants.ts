import { cva } from 'class-variance-authority';

/** Factory badges — 3px square chrome (no soft md pills). */
export const badgeVariants = cva(
  'flex w-fit shrink-0 flex-row items-center justify-center gap-1.5 self-start overflow-hidden whitespace-nowrap rounded-[3px] border border-border px-2 py-1 font-semibold text-xs transition-[color,box-shadow] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-foreground',
        secondary: 'border-transparent bg-card-panel',
        destructive: 'border-transparent bg-destructive',
        outline: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const badgeTextVariants = cva(
  'whitespace-nowrap font-semibold text-sm leading-none',
  {
    variants: {
      variant: {
        default: 'text-background',
        secondary: 'text-foreground',
        destructive: 'text-white',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const badgeIconVariants = cva('size-4', {
  variants: {
    variant: {
      default: 'text-background',
      secondary: 'text-foreground',
      destructive: 'text-white',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
