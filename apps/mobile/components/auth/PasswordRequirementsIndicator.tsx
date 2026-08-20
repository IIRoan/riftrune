import { View } from 'react-native';
import { CircleCheckIcon, CircleIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { getSignUpPasswordRequirements } from '@/components/auth/password-requirements';
import { cn } from '@/lib/utils';

export function PasswordRequirementsIndicator({ password }: { password: string }) {
  const requirements = getSignUpPasswordRequirements(password);
  const unmetCount = requirements.filter((requirement) => !requirement.met).length;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={
        unmetCount === 0
          ? 'Password meets all requirements'
          : `Password requirements: ${String(unmetCount)} remaining`
      }
      className="gap-1.5 rounded-[3px] border border-border bg-card-panel px-3 py-2.5"
    >
      {requirements.map((requirement) => (
        <View key={requirement.id} className="flex-row items-center gap-2">
          {requirement.met ? (
            <CircleCheckIcon className="size-3.5 text-success" weight="bold" />
          ) : (
            <CircleIcon className="size-3.5 text-muted-foreground" weight="bold" />
          )}
          <Text
            className={cn(
              'text-[13px] leading-4',
              requirement.met ? 'text-success' : 'text-muted-foreground'
            )}
          >
            {requirement.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
