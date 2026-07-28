import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SecureMarkdown } from '@/components/ui/markdown';
import { Text } from '@/components/ui/text';
import { TextareaInput } from '@/components/ui/textarea-input';
import { clampMarkdownSource } from '@/lib/markdown-safe';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

type EditorMode = 'write' | 'preview';

interface DeckDescriptionViewProps {
  description: string;
  className?: string;
  /** Hide the section entirely when empty (view/showcase). */
  hideWhenEmpty?: boolean;
}

interface DeckDescriptionEditorProps {
  value: string;
  onChange: (description: string) => void;
  className?: string;
}

export function DeckDescriptionView({
  description,
  className,
  hideWhenEmpty = true,
}: DeckDescriptionViewProps) {
  const trimmed = description.trim();
  if (hideWhenEmpty && !trimmed) return null;

  return (
    <View
      className={cn(
        'gap-1.5 rounded-lg border border-archive-soft-line/80 bg-background/40 px-2.5 py-2',
        className
      )}
    >
      <Text className="text-[11px] font-semibold text-muted-foreground">Description</Text>
      <SecureMarkdown>{trimmed}</SecureMarkdown>
    </View>
  );
}

export function DeckDescriptionEditor({
  value,
  onChange,
  className,
}: DeckDescriptionEditorProps) {
  const [mode, setMode] = useState<EditorMode>('write');
  // Keep a local draft so parent deck re-renders (persist/autosave) cannot
  // reset the caret while the field is focused.
  const [draft, setDraft] = useState(value);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(value);
  }, [value]);

  const trimmed = draft.trim();

  return (
    <View className={cn('gap-2', className)}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </Text>
        <View
          accessibilityRole="radiogroup"
          className="flex-row gap-1 rounded-md border border-border bg-card-panel p-0.5"
        >
          {(['write', 'preview'] as const).map((option) => {
            const selected = mode === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                className={cn(
                  'rounded px-2 py-1',
                  selected ? 'bg-card' : 'active:bg-accent/60'
                )}
                onPress={() => {
                  if (selected) return;
                  hapticPress();
                  setMode(option);
                }}
              >
                <Text
                  className={cn(
                    'text-[11px] font-semibold capitalize',
                    selected ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {mode === 'write' ? (
        <>
          <TextareaInput
            value={draft}
            onChangeText={(next) => {
              const clamped = clampMarkdownSource(next);
              setDraft(clamped);
              onChange(clamped);
            }}
            onFocus={() => {
              focusedRef.current = true;
            }}
            onBlur={() => {
              focusedRef.current = false;
            }}
            placeholder={'Supports markdown — e.g. # Title, **bold**, lists, [links](https://…)'}
            className="min-h-32"
          />
          <Text className="text-[11px] leading-4 text-muted-foreground">
            Markdown only. Links must be http(s) or mailto; HTML and images are ignored.
          </Text>
        </>
      ) : trimmed ? (
        <View className="min-h-24 rounded-lg border border-border bg-background/40 px-2.5 py-2">
          <SecureMarkdown>{trimmed}</SecureMarkdown>
        </View>
      ) : (
        <View className="min-h-24 items-center justify-center rounded-lg border border-dashed border-border px-2.5 py-2">
          <Text className="text-[12px] text-muted-foreground">Nothing to preview yet.</Text>
        </View>
      )}
    </View>
  );
}
