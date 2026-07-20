import { useState } from 'react';
import { DecksListScreen } from '@/components/deck/DecksListScreen';
import { useDebounce } from '@/hooks/useDebounce';
import { useOwnedDecks } from '@/hooks/useDecks';

export default function MyDecksScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const ownedDecks = useOwnedDecks(debouncedQuery);

  return (
    <DecksListScreen
      title="My decks"
      subtitle="Your Riftbound lists"
      searchPlaceholder="Search your decks"
      query={query}
      onQueryChange={setQuery}
      decksQuery={ownedDecks}
      emptyTitle="No decks yet"
      emptyDescription="Create a deck to add your Legend, Champion, main deck, runes, and battlefields with live rules validation."
      showCreate
      showImport
    />
  );
}
