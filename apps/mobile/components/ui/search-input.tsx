import { INPUT_SEARCH_SHELL_CLASS } from '@/constants/catalogToolbar';
import { cn } from '@/lib/utils';
import { SearchIcon } from '@/components/icons';
import {
  Input,
  InputAddon,
  type InputAddonChildren,
  InputAddonIcon,
  InputPressable,
  type InputProps,
  useInputAddons,
  useInputFocusState,
} from './input';

// Types
export type SearchInputProps = InputProps & {
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  children?: InputAddonChildren;
};

// Components
export const SearchInput = ({
  onFocus,
  onBlur,
  disabled,
  children,
  className,
  accessibilityRole = 'search',
  ...props
}: SearchInputProps) => {
  const { isFocused, internalRef, handleFocus, handleBlur, handlePress } =
    useInputFocusState({ onFocus, onBlur });

  const { startAddons, endAddons, pressableClassName } = useInputAddons(children);

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
        accessibilityRole={accessibilityRole}
        className={cn('shrink')}
        disabled={disabled}
        onBlur={handleBlur}
        onFocus={handleFocus}
        ref={internalRef}
      />

      {endAddons}
    </InputPressable>
  );
};
