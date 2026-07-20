import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Modal, Pressable, View } from 'react-native';
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet';
import { Button, ButtonIcon } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { XIcon } from '@/components/icons';
import { Portal, PortalOverlay } from '@/components/ui/portal';
import { useShowSideRail } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';

type AppSheetMode = 'sheet' | 'dialog';

type AppSheetContextValue = {
  mode: AppSheetMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissible: boolean;
};

const AppSheetContext = createContext<AppSheetContextValue | null>(null);

function useAppSheetContext() {
  const ctx = useContext(AppSheetContext);
  if (!ctx) {
    throw new Error('AppSheet components must be used within AppSheet');
  }
  return ctx;
}

interface AppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** When false, overlay / close cannot dismiss (e.g. while busy). */
  dismissible?: boolean;
}

/**
 * Unified overlay shell for short confirmations and pickers.
 * Mobile → bottom sheet. Desktop (side rail) → centered dialog.
 * Header / title / body chrome match BottomSheet so surfaces look the same.
 */
export function AppSheet({
  open,
  onOpenChange,
  children,
  dismissible = true,
}: AppSheetProps) {
  const showRail = useShowSideRail();
  const mode: AppSheetMode = showRail ? 'dialog' : 'sheet';

  const value = useMemo(
    () => ({
      mode,
      open,
      onOpenChange,
      dismissible,
    }),
    [dismissible, mode, onOpenChange, open]
  );

  if (mode === 'sheet') {
    return (
      <AppSheetContext.Provider value={value}>
        <BottomSheet
          open={open}
          onOpenChange={(next) => {
            if (!next && !dismissible) return;
            onOpenChange(next);
          }}
        >
          {children}
        </BottomSheet>
      </AppSheetContext.Provider>
    );
  }

  return <AppSheetContext.Provider value={value}>{children}</AppSheetContext.Provider>;
}

export function AppSheetPortal({
  name = 'app-sheet',
  children,
}: {
  name?: string;
  children: ReactNode;
}) {
  const ctx = useAppSheetContext();
  const { mode, open, onOpenChange, dismissible } = ctx;

  // Portals render outside the React tree — re-provide context (same as BottomSheetPortal).
  const portaled = (
    <AppSheetContext.Provider value={ctx}>{children}</AppSheetContext.Provider>
  );

  if (mode === 'sheet') {
    return <BottomSheetPortal name={name}>{portaled}</BottomSheetPortal>;
  }

  if (!open) return null;

  return (
    <Portal name={name}>
      <PortalOverlay>
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {
            if (dismissible) onOpenChange(false);
          }}
        >
          <View className="flex-1 items-center justify-center px-6 py-8">{portaled}</View>
        </Modal>
      </PortalOverlay>
    </Portal>
  );
}

export function AppSheetOverlay({ className }: { className?: string }) {
  const { mode, onOpenChange, dismissible } = useAppSheetContext();

  if (mode === 'sheet') {
    return <BottomSheetOverlay className={className} closeOnPress={dismissible} />;
  }

  return (
    <Pressable
      accessibilityLabel="Dismiss"
      className={cn('absolute inset-0 bg-black/50', className)}
      disabled={!dismissible}
      onPress={() => {
        if (dismissible) onOpenChange(false);
      }}
    />
  );
}

type AppSheetContentProps = ComponentProps<typeof View> & {
  enableDynamicSizing?: boolean;
  enablePanDownToClose?: boolean;
};

export function AppSheetContent({
  children,
  className,
  enableDynamicSizing,
  enablePanDownToClose,
  ...props
}: AppSheetContentProps) {
  const { mode, dismissible } = useAppSheetContext();

  if (mode === 'sheet') {
    return (
      <BottomSheetContent
        enableDynamicSizing={enableDynamicSizing}
        enablePanDownToClose={enablePanDownToClose ?? dismissible}
        className={className}
      >
        {children}
      </BottomSheetContent>
    );
  }

  return (
    <View
      className={cn(
        'z-10 w-full max-w-md overflow-hidden rounded-2xl bg-background',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function AppSheetHeader({
  className,
  children,
  ...props
}: ComponentProps<typeof View>) {
  const { mode, onOpenChange, dismissible } = useAppSheetContext();

  if (mode === 'sheet') {
    return (
      <BottomSheetHeader className={className} {...props}>
        {children}
      </BottomSheetHeader>
    );
  }

  return (
    <View
      className={cn('flex flex-row items-center gap-1 bg-background p-4', className)}
      {...props}
    >
      {children}
      <Button
        className="ml-auto"
        size="icon"
        variant="link"
        disabled={!dismissible}
        onPress={() => {
          if (dismissible) onOpenChange(false);
        }}
      >
        <ButtonIcon className="text-foreground">
          <XIcon />
        </ButtonIcon>
      </Button>
    </View>
  );
}

export function AppSheetTitle({ className, ...props }: ComponentProps<typeof Text>) {
  const { mode } = useAppSheetContext();

  if (mode === 'sheet') {
    return <BottomSheetTitle className={className} {...props} />;
  }

  return (
    <Text
      className={cn('font-semibold text-foreground text-xl leading-none', className)}
      {...props}
    />
  );
}

export function AppSheetBody({ className, ...props }: ComponentProps<typeof View>) {
  const { mode } = useAppSheetContext();

  if (mode === 'sheet') {
    return <BottomSheetBody className={className} {...props} />;
  }

  return <View className={cn('px-4', className)} {...props} />;
}

export function AppSheetFooter({ className, ...props }: ComponentProps<typeof View>) {
  const { mode } = useAppSheetContext();

  if (mode === 'sheet') {
    return <BottomSheetFooter className={className} {...props} />;
  }

  return (
    <View
      className={cn(
        'mt-auto flex flex-col gap-2 border-border border-t bg-background px-4 pt-4 pb-4',
        className
      )}
      {...props}
    />
  );
}

export const AppSheetScrollView = BottomSheetScrollView;
export const AppSheetClose = BottomSheetClose;

export function useAppSheetDismiss() {
  const { onOpenChange, dismissible } = useAppSheetContext();
  return useCallback(() => {
    if (dismissible) onOpenChange(false);
  }, [dismissible, onOpenChange]);
}
