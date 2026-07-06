'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:7000';
const REFRESH_INTERVAL = 60_000;

type ApiSet = { id: string; code: string; name: string; count: number };
type ApiFilterEntry = { id: string; name: string; count: number };
type ApiColor = ApiFilterEntry & { imageUrl: string };

type FiltersResponse = {
  data: {
    sets: ApiSet[];
    types: ApiFilterEntry[];
    rarities: ApiFilterEntry[];
    colors: ApiColor[];
    variants: ApiFilterEntry[];
    supertypes: ApiFilterEntry[];
  };
  meta: { cachedAt: string; catalogHash: string };
};

export type CollectionData = {
  sets: { code: string; name: string; count: number }[];
  types: { name: string; count: number }[];
  rarities: { name: string; count: number }[];
  colors: { name: string; count: number; imageUrl: string }[];
  variants: { name: string; count: number }[];
  supertypes: { name: string; count: number }[];
  cachedAt: string | null;
};

async function fetchFilters(): Promise<CollectionData> {
  const res = await fetch(`${API_BASE}/api/v1/filters`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Filters endpoint returned ${res.status}`);
  const json: FiltersResponse = await res.json();
  return {
    sets: json.data.sets.map((s) => ({ code: s.code, name: s.name, count: s.count })),
    types: json.data.types.map((t) => ({ name: t.name, count: t.count })),
    rarities: json.data.rarities.map((r) => ({ name: r.name, count: r.count })),
    colors: json.data.colors.map((c) => ({
      name: c.name,
      count: c.count,
      imageUrl: c.imageUrl,
    })),
    variants: json.data.variants.map((v) => ({ name: v.name, count: v.count })),
    supertypes: json.data.supertypes.map((s) => ({ name: s.name, count: s.count })),
    cachedAt: json.meta?.cachedAt ?? null,
  };
}

export function useCollectionData() {
  const [data, setData] = useState<CollectionData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doFetch = useCallback(async () => {
    try {
      const result = await fetchFilters();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void doFetch();
    timerRef.current = setInterval(() => void doFetch(), REFRESH_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [doFetch]);

  return { data, error, loading, refetch: doFetch };
}
