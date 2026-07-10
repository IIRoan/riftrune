import { ActivityIndicator } from 'react-native';
import {
  InputAddon,
  InputAddonButton,
  InputAddonButtonIcon,
} from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { XIcon } from '@/components/icons';
import type { TextInputProps } from 'react-native';

interface SearchBarProps extends Pick<TextInputProps, 'onSubmitEditing' | 'autoFocus'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  isLoading = false,
  placeholder = 'Search cards…',
  onSubmitEditing,
  autoFocus,
}: SearchBarProps) {
  return (
    <SearchInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      returnKeyType="search"
      autoCapitalize="none"
      autoCorrect={false}
      onSubmitEditing={onSubmitEditing}
      autoFocus={autoFocus}
    >
      {isLoading ? (
        <InputAddon align="inline-end">
          <ActivityIndicator size="small" className="accent-primary" />
        </InputAddon>
      ) : null}
      {value.length > 0 && !isLoading ? (
        <InputAddon align="inline-end">
          <InputAddonButton
            accessibilityLabel="Clear search"
            onPress={onClear}
            size="sm"
            variant="ghost"
          >
            <InputAddonButtonIcon>
              <XIcon />
            </InputAddonButtonIcon>
          </InputAddonButton>
        </InputAddon>
      ) : null}
    </SearchInput>
  );
}
