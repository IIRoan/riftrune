import { Modal, useWindowDimensions, View } from 'react-native';
import {
  RuneChargeLoader,
  runeSizeForShortSide,
  type RuneChargeSize,
} from '@/components/riftbound/RuneChargeLoader';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type AppLoaderProps = {
  size?: RuneChargeSize;
  /** Optional status copy — prefer the rune fill alone for generic loading. */
  label?: string;
  detail?: string;
  className?: string;
  accessibilityLabel?: string;
};

/** Centered rune mark with optional status copy. */
export function AppLoader({
  size = 'md',
  label,
  detail,
  className,
  accessibilityLabel,
}: AppLoaderProps) {
  return (
    <View className={cn('items-center justify-center gap-3', className)}>
      <RuneChargeLoader
        size={size}
        accessibilityLabel={accessibilityLabel ?? label ?? 'Loading'}
      />
      {label ? (
        <View className="items-center gap-1 px-4">
          <Text className="text-center text-base font-semibold text-foreground">
            {label}
          </Text>
          {detail ? (
            <Text className="text-center text-sm text-muted-foreground">{detail}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Full-screen / flex-fill blocking loader — rune only by default. */
export function AppLoadingScreen({ size, label, detail, className }: AppLoaderProps) {
  const { width, height } = useWindowDimensions();
  const stageSize = size ?? runeSizeForShortSide(Math.min(width, height));

  return (
    <View
      className={cn(
        'min-h-0 w-full flex-1 items-center justify-center bg-background px-6',
        className
      )}
      style={{ flex: 1 }}
    >
      <AppLoader size={stageSize} label={label} detail={detail} />
    </View>
  );
}

type AppLoadingOverlayProps = {
  visible: boolean;
  message?: string;
  detail?: string;
  onRequestClose?: () => void;
};

/** Modal overlay for long-running actions — rune fill is the primary signal. */
export function AppLoadingOverlay({
  visible,
  message,
  detail,
  onRequestClose,
}: AppLoadingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 bg-background">
        <AppLoadingScreen label={message} detail={detail} />
      </View>
    </Modal>
  );
}
