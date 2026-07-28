import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EyeIcon, PencilIcon, ThemedIcon } from '@/components/icons';
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
  /** Fill available height (middle builder column). */
  fill?: boolean;
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

function ModeToggle({
  mode,
  onChange,
}: {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      className="flex-row gap-1 rounded-lg border border-border bg-card-panel p-1"
    >
      {(
        [
          { value: 'write', label: 'Write', icon: PencilIcon },
          { value: 'preview', label: 'Preview', icon: EyeIcon },
        ] as const
      ).map((option) => {
        const selected = mode === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            className={cn(
              'min-h-8 flex-row items-center gap-1.5 rounded-md px-2.5 py-1.5',
              selected ? 'border border-border bg-card' : 'active:bg-accent/60'
            )}
            onPress={() => {
              if (selected) return;
              hapticPress();
              onChange(option.value);
            }}
          >
            <ThemedIcon
              icon={option.icon}
              size={13}
              color={selected ? 'foreground' : 'muted-foreground'}
            />
            <Text
              className={cn(
                'text-[12px] font-semibold',
                selected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DeckDescriptionEditor({
  value,
  onChange,
  className,
  fill = false,
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

  const body =
    mode === 'write' ? (
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
          placeholder={'# Matchup guide\n\n**Game plan**\n- Keep pressure early\n- [Guide](https://…)'}
          className={cn(fill ? 'min-h-0 flex-1' : 'min-h-32')}
        />
        <Text className="text-[11px] leading-4 text-muted-foreground">
          Markdown supported. Links must be http(s) or mailto — HTML and images are ignored.
        </Text>
      </>
    ) : trimmed ? (
      <ScrollView
        className={cn(
          'rounded-xl border border-border bg-card-panel',
          fill ? 'min-h-0 flex-1' : undefined
        )}
        contentContainerClassName="px-5 py-5"
        contentContainerStyle={fill ? { flexGrow: 1 } : undefined}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-auto w-full max-w-2xl gap-1">
          <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Rendered preview
          </Text>
          <SecureMarkdown variant="prose">{trimmed}</SecureMarkdown>
        </View>
      </ScrollView>
    ) : (
      <View
        className={cn(
          'items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card-panel/60 px-6 py-8',
          fill ? 'min-h-0 flex-1' : 'min-h-32'
        )}
      >
        <View className="size-10 items-center justify-center rounded-full bg-muted">
          <ThemedIcon icon={EyeIcon} size={18} color="muted-foreground" />
        </View>
        <Text className="text-[14px] font-semibold text-foreground">Nothing to preview</Text>
        <Text className="max-w-xs text-center text-[12px] leading-5 text-muted-foreground">
          Switch to Write and add markdown — headings, lists, and bold will show up here.
        </Text>
      </View>
    );

  return (
    <View className={cn('gap-3', fill && 'min-h-0 flex-1', className)}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-[15px] font-semibold text-foreground">Description</Text>
          <Text className="text-[12px] text-muted-foreground">
            {mode === 'write' ? 'Edit markdown source' : 'How your description will look'}
          </Text>
        </View>
        <ModeToggle mode={mode} onChange={setMode} />
      </View>
      {body}
    </View>
  );
}

interface DeckDescriptionPanelProps {
  value: string;
  onChange: (description: string) => void;
  paddingBottom?: number;
  className?: string;
}

/** Spacious middle-column description workspace for the deck builder. */
export function DeckDescriptionPanel({
  value,
  onChange,
  paddingBottom = 0,
  className,
}: DeckDescriptionPanelProps) {
  return (
    <View
      className={cn(
        'min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card px-5 py-5',
        className
      )}
      style={{ paddingBottom: Math.max(paddingBottom, 16) }}
    >
      <DeckDescriptionEditor value={value} onChange={onChange} fill />
    </View>
  );
}
