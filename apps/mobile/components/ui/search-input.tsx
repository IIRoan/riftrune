import { forwardRef } from 'react';
import { Platform, View, type TextInput as RNTextInput } from 'react-native';
import { INPUT_SEARCH_SHELL_CLASS } from '@/constants/catalogToolbar';
import { cn, mergeRefs } from '@/lib/utils';
import { SearchIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { Input, InputAddon, InputAddonIcon, InputPressable } from './input';
import type { InputAddonChildren, InputProps } from './input.types';
import { useInputAddons, useInputFocusState } from './input.hooks';

export type SearchInputProps = InputProps & {
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  children?: InputAddonChildren;
  /** Web-only idle keyboard hint (e.g. `/`). */
  shortcutHint?: string;
};

function ShortcutHint({ label }: { label: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="mr-1.5 h-5 min-w-5 items-center justify-center rounded-[3px] border border-border bg-card-panel px-1.5"
    >
      <Text className="font-mono text-[11px] font-normal uppercase leading-none tracking-[-0.24px] text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}

export const SearchInput = forwardRef<RNTextInput, SearchInputProps>(
  (
    {
      onFocus,
      onBlur,
      disabled,
      children,
      className,
      accessibilityRole = 'search',
      shortcutHint,
      value,
      ...props
    },
    ref
  ) => {
    const { isFocused, internalRef, handleFocus, handleBlur, handlePress } =
      useInputFocusState({ onFocus, onBlur });
    const mergedRef = mergeRefs(internalRef, ref);

    const { startAddons, endAddons, pressableClassName } = useInputAddons(children);
    const hasValue = typeof value === 'string' ? value.length > 0 : value != null;
    const showShortcutHint =
      Platform.OS === 'web' && Boolean(shortcutHint) && !isFocused && !hasValue;

    return (
      <InputPressable
        bordered
        className={cn(pressableClassName, INPUT_SEARCH_SHELL_CLASS, className)}
        disabled={disabled}
        focused={isFocused}
        onPress={handlePress}
      >
        <InputAddon align="inline-start">
          <InputAddonIcon>
            <SearchIcon />
          </InputAddonIcon>
        </InputAddon>

        {startAddons}

        <Input
          {...props}
          value={value}
          accessibilityRole={accessibilityRole}
          accessibilityHint={
            shortcutHint && Platform.OS === 'web'
              ? `Press ${shortcutHint} to focus search`
              : undefined
          }
          className={cn('shrink')}
          disabled={disabled}
          onBlur={handleBlur}
          onFocus={handleFocus}
          ref={mergedRef}
        />

        {shortcutHint ? (
          <InputAddon
            align="inline-end"
            className={cn(!showShortcutHint && 'w-0 min-w-0 overflow-hidden opacity-0')}
          >
            <View pointerEvents="none">
              <ShortcutHint label={shortcutHint} />
            </View>
          </InputAddon>
        ) : null}

        {endAddons}
      </InputPressable>
    );
  }
);

SearchInput.displayName = 'SearchInput';
