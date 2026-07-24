import { cva } from 'class-variance-authority';
import { ActivityIndicator, View } from 'react-native';
import * as ToastPrimitive from 'sonner-native';
import { useUniwind } from 'uniwind';
import { cn } from '@/lib/utils';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
} from '@/components/icons';
import { Text } from './text';

// Types
type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

type ToastGlyphProps = {
  variant: ToastVariant;
};

type ToastOptions = NonNullable<Parameters<typeof ToastPrimitive.toast.custom>[1]>;

type PromiseOptions = {
  loading: string;
  success: string | ((result: unknown) => string);
  error: string | ((error: unknown) => string);
} & Omit<ToastOptions, 'description' | 'icon'>;

// Components
const ToastGlyphIcon = ({ variant }: ToastGlyphProps) => {
  const className = iconVariants({ variant });

  if (variant === 'success') {
    return <CircleCheckIcon className={className} weight="bold" />;
  }

  if (variant === 'error') {
    return <TriangleAlertIcon className={className} weight="bold" />;
  }

  if (variant === 'warning') {
    return <CircleAlertIcon className={className} weight="bold" />;
  }

  return <InfoIcon className={className} weight="bold" />;
};

/** Recessed status slot — same panel grammar as the deck / catalog icon tiles. */
const ToastGlyph = ({ variant }: ToastGlyphProps) => {
  if (variant === 'default') return null;

  return (
    <View className="size-7 shrink-0 items-center justify-center rounded-lg bg-card-panel">
      {variant === 'loading' ? (
        <ActivityIndicator className="accent-muted-foreground" size="small" />
      ) : (
        <ToastGlyphIcon variant={variant} />
      )}
    </View>
  );
};

type ToastCardProps = {
  variant: ToastVariant;
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

/**
 * Floating archive panel — raised above the screen surface in either theme,
 * status carried by the glyph so meaning survives without color.
 */
const ToastCard = ({ variant, title, description, icon }: ToastCardProps) => (
  <View className="w-full items-center px-4">
    <View
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityLiveRegion={variant === 'error' ? 'assertive' : 'polite'}
      accessibilityRole="alert"
      accessible
      className={cn(
        'w-full max-w-sm flex-row gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-lg shadow-black/25 dark:bg-popover',
        description ? 'items-start' : 'items-center'
      )}
    >
      {icon ?? <ToastGlyph variant={variant} />}
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-medium leading-5 text-foreground" numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <Text
            className="mt-0.5 text-[13px] leading-snug text-muted-foreground"
            numberOfLines={3}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  </View>
);

export const Toaster = (props: Omit<ToastPrimitive.ToasterProps, 'theme'>) => {
  const { theme: uniwindTheme } = useUniwind();
  const theme = uniwindTheme === 'dark' ? 'dark' : 'light';

  return (
    <ToastPrimitive.Toaster
      enableStacking
      gap={8}
      offset={12}
      position="top-center"
      swipeToDismissDirection="up"
      visibleToasts={3}
      {...props}
      theme={theme}
    />
  );
};

// Utils
const showToast = (variant: ToastVariant, title: string, options?: ToastOptions) => {
  const { description, icon, ...rest } = options ?? {};

  return ToastPrimitive.toast.custom(
    <ToastCard description={description} icon={icon} title={title} variant={variant} />,
    rest
  );
};

export const toast = Object.assign(
  (message: string, options?: ToastOptions) => showToast('default', message, options),
  {
    custom: ToastPrimitive.toast.custom,
    dismiss: ToastPrimitive.toast.dismiss,
    error: (message: string, options?: ToastOptions) =>
      showToast('error', message, options),
    info: (message: string, options?: ToastOptions) =>
      showToast('info', message, options),
    loading: (message: string, options?: ToastOptions) =>
      showToast('loading', message, options),
    promise: <T,>(promise: Promise<T>, options: PromiseOptions) => {
      const { loading, success, error, ...rest } = options;
      const id = ToastPrimitive.toast.custom(
        <ToastCard title={loading} variant="loading" />,
        { ...rest, duration: Number.POSITIVE_INFINITY }
      );

      promise
        .then((data) => {
          const title = typeof success === 'function' ? success(data) : success;
          ToastPrimitive.toast.custom(<ToastCard title={title} variant="success" />, {
            duration: rest.duration,
            id,
          });
        })
        .catch((err) => {
          const title = typeof error === 'function' ? error(err) : error;
          ToastPrimitive.toast.custom(<ToastCard title={title} variant="error" />, {
            duration: rest.duration,
            id,
          });
        });

      return id;
    },
    success: (message: string, options?: ToastOptions) =>
      showToast('success', message, options),
    warning: (message: string, options?: ToastOptions) =>
      showToast('warning', message, options),
    wiggle: ToastPrimitive.toast.wiggle,
  }
);

// Styles
const iconVariants = cva('size-4', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      error: 'text-destructive',
      info: 'text-archive-accent-text',
      loading: 'text-muted-foreground',
      success: 'text-success',
      warning: 'text-warning',
    },
  },
});
