import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import { PortalHost } from '@/components/ui/portal';
import { Toaster } from '@/components/ui/toast';

export function TetraProvider({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardProvider>
      <SafeAreaListener
        onChange={({ insets }) => {
          Uniwind.updateInsets(insets);
        }}
      >
        {children}
        <PortalHost />
        <Toaster />
      </SafeAreaListener>
    </KeyboardProvider>
  );
}
