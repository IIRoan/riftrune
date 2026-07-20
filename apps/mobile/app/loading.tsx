import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RuneChargeLoader } from '@/components/riftbound/RuneChargeLoader';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { AppLoader, AppLoadingOverlay } from '@/components/ui/app-loader';
import { Button, ButtonText } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const SIZES = ['sm', 'md', 'lg', 'xl'] as const;

/** Design playground for the unified rune loading mark. */
export default function LoadingPreviewScreen() {
  const insets = useSafeAreaInsets();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<(typeof SIZES)[number]>('lg');

  useEffect(() => {
    if (!overlayOpen) return;
    const timer = setTimeout(() => setOverlayOpen(false), 2800);
    return () => clearTimeout(timer);
  }, [overlayOpen]);

  return (
    <ScreenLayout>
      <ScreenHeader title="Preview" subtitle="Rune fills with color — no status copy" />

      <View
        className="mt-4 items-center justify-center rounded-2xl border border-border bg-card py-14"
        style={{ minHeight: 220 }}
      >
        <AppLoader size={selectedSize} />
      </View>

      <SectionLabel className="mt-8">Size</SectionLabel>
      <View className="flex-row flex-wrap gap-2">
        {SIZES.map((size) => (
          <Pressable
            key={size}
            onPress={() => setSelectedSize(size)}
            className={cn(
              'rounded-lg border px-3 py-2',
              selectedSize === size
                ? 'border-primary bg-primary/15'
                : 'border-border bg-card'
            )}
          >
            <Text
              className={cn(
                'font-mono text-xs uppercase tracking-wide',
                selectedSize === size ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {size}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionLabel className="mt-8">Scale strip</SectionLabel>
      <View className="flex-row items-end justify-between rounded-2xl border border-border bg-card px-6 py-8">
        {SIZES.map((size) => (
          <View key={size} className="items-center gap-2">
            <RuneChargeLoader size={size} />
            <Text className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {size}
            </Text>
          </View>
        ))}
      </View>

      <SectionLabel className="mt-8">Overlay</SectionLabel>
      <Button onPress={() => setOverlayOpen(true)}>
        <ButtonText>Preview overlay</ButtonText>
      </Button>

      <Text
        className="mt-8 text-sm text-muted-foreground"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        Reduced motion: holds a partial fill.
      </Text>

      <AppLoadingOverlay
        visible={overlayOpen}
        onRequestClose={() => setOverlayOpen(false)}
      />
    </ScreenLayout>
  );
}
