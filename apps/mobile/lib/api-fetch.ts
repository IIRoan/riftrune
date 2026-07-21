/** Delay before retrying after a likely Railway cold-start / gateway failure. */
export const API_WAKE_RETRY_DELAY_MS = 4_000;

const WAKE_STATUS_CODES = new Set([408, 425, 429, 502, 503, 504]);

export function isApiWakeStatus(status: number): boolean {
  return WAKE_STATUS_CODES.has(status);
}

export function isApiWakeNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();
  return (
    name === 'typeerror' ||
    name === 'aborterror' ||
    name === 'networkerror' ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('timed out') ||
    message.includes('timeout')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Fetch wrapper for the hosted API: on the first cold-start style failure
 * (network error or gateway status), wait for the service to wake and retry once.
 */
export async function fetchWithApiWake(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    const res = await fetch(input, init);
    if (!isApiWakeStatus(res.status)) {
      return res;
    }

    await delay(API_WAKE_RETRY_DELAY_MS);
    return fetch(input, init);
  } catch (error) {
    if (!isApiWakeNetworkError(error)) {
      throw error;
    }

    await delay(API_WAKE_RETRY_DELAY_MS);
    return fetch(input, init);
  }
}
