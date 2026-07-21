import { API_URL } from './helpers/env';

export default async function globalSetup(): Promise<void> {
  const healthUrl = `${API_URL}/api/v1/health`;
  try {
    const res = await fetch(healthUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `UI e2e needs the API at ${healthUrl} (${detail}). Start it with: bun run dev:api`
    );
  }

  const probe = await fetch(`${API_URL}/api/v1/cards?q=OGN-015&limit=1`);
  if (!probe.ok) {
    throw new Error(`Catalog probe failed: HTTP ${probe.status}`);
  }
  const body = (await probe.json()) as { data?: unknown[] };
  if (!Array.isArray(body.data) || body.data.length === 0) {
    throw new Error(
      'Catalog has no OGN-015 — sync first: bun run sync:catalog (API must be running)'
    );
  }
}
