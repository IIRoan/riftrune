import { useState } from 'react';
import { DecksListScreen } from '@/components/deck/DecksListScreen';
import { useDebounce } from '@/hooks/useDebounce';
import { useImportedDecks } from '@/hooks/useDecks';

export default function BrowseDecksScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const importedDecks = useImportedDecks(debouncedQuery);

  return (
    <DecksListScreen
      title="Browse decks"
      subtitle="Search public decks from Piltover Archive"
      searchPlaceholder="Search by name or legend"
      query={query}
      onQueryChange={setQuery}
      decksQuery={importedDecks}
      emptyTitle="No decks found"
      emptyDescription="Try a different search term, or check back later for new public decks."
    />
  );
}
