import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/** Legacy route — deck format is chosen from the decks list sheet. */
export default function DeckCreateRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/decks');
  }, [router]);

  return null;
}
