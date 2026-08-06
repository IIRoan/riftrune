import { useCollectionLiveSync } from '@/hooks/useCollectionLiveSync';
import { AppBootstrapProvider } from '@/hooks/useAppBootstrap';
import { authClient } from '@/src/lib/auth-client';

function AppBootstrapEffects({ signedIn }: { signedIn: boolean }) {
  useCollectionLiveSync(signedIn);
  return null;
}

/**
 * Orchestrates phased app warm-up after TanStack Query AsyncStorage restore.
 * Mount once inside PersistQueryClientProvider.
 */
export function AppBootstrap({ children }: { children?: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const signedInUserId = session?.user?.id ?? null;

  return (
    <AppBootstrapProvider signedInUserId={signedInUserId}>
      <AppBootstrapEffects signedIn={Boolean(signedInUserId)} />
      {children}
    </AppBootstrapProvider>
  );
}
