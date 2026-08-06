import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'flex w-fit shrink-0 flex-row items-center justify-center gap-1.5 self-start overflow-hidden whitespace-nowrap rounded-md border border-border px-2 py-1 font-medium text-xs transition-[color,box-shadow] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary',
        secondary: 'border-transparent bg-secondary',
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

export const badgeIconVariants = cva('size-4', {
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
