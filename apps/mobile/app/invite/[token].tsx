import { Redirect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { Button, ButtonText } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/text';
import {
  buildCollectionInviteDeepLink,
  collectionInviteAcceptPath,
  isLikelyMobileUserAgent,
} from '@/lib/collection-invite-link';

function readBrowserUserAgent(): string {
  if (Platform.OS !== 'web') return '';
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent ?? '';
}

function acceptHref(token: string): Href {
  return collectionInviteAcceptPath(token) as Href;
}

/**
 * HTTPS invite landing page.
 * - Desktop web: continue straight to the web accept flow
 * - Mobile web: try opening the native riftrune:// deep link, with web fallback
 * - Native app: go straight to the in-app accept screen
 */
export default function CollectionInviteLinkingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : undefined;
  const [attemptedAppOpen, setAttemptedAppOpen] = useState(false);

  const deepLink = token ? buildCollectionInviteDeepLink(token) : null;
  const acceptPath = token ? acceptHref(token) : null;
  const onNative = Platform.OS === 'ios' || Platform.OS === 'android';
  const onWeb = Platform.OS === 'web';
  const mobileBrowser = onWeb && isLikelyMobileUserAgent(readBrowserUserAgent());

  useEffect(() => {
    if (!token || !deepLink || !acceptPath) return;

    if (onNative) {
      router.replace(acceptPath);
      return;
    }

    if (onWeb && !mobileBrowser) {
      router.replace(acceptPath);
      return;
    }

    if (onWeb && mobileBrowser) {
      // Attempt to hand off to the installed app; keep this page as fallback UI.
      window.location.href = deepLink;
      setAttemptedAppOpen(true);
    }
  }, [token, deepLink, acceptPath, onNative, onWeb, mobileBrowser, router]);

  if (!token || !deepLink || !acceptPath) {
    return (
      <ScreenLayout>
        <ScreenHeader title="Join collection" />
        <Text className="mt-4 text-sm text-muted-foreground">Missing invite token.</Text>
      </ScreenLayout>
    );
  }

  if (onNative || (onWeb && !mobileBrowser)) {
    return <Redirect href={acceptPath} />;
  }

  return (
    <ScreenLayout>
      <ScreenHeader title="Open Riftrune" />
      <View className="mt-4 gap-4">
        <Text className="text-base text-foreground">
          {attemptedAppOpen
            ? 'Opening the Riftrune app…'
            : 'This invite opens in the Riftrune app.'}
        </Text>
        <Text className="text-sm text-muted-foreground">
          If the app does not open, use one of the options below.
        </Text>
        <Button
          onPress={() => {
            void Linking.openURL(deepLink);
          }}
        >
          <ButtonText>Open in Riftrune app</ButtonText>
        </Button>
        <Button
          variant="outline"
          onPress={() => {
            router.replace(acceptPath);
          }}
        >
          <ButtonText>Continue in browser</ButtonText>
        </Button>
      </View>
    </ScreenLayout>
  );
}
