import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const FOIL_CARD = {
  query: 'OGN-015',
  name: 'Captain Farron',
  standardId: 'OGN-015',
  foilId: 'OGN-015-Foil',
} as const;

export async function searchForCard(page: Page, query: string, cardName: string): Promise<void> {
  const search = page.getByPlaceholder('Search cards, artists, tags, or set numbers');
  await search.fill(query);
  await expect(cardTile(page, cardName, query)).toBeVisible({ timeout: 30_000 });
}

/** Search-result tile (not the detail panel, which duplicates steppers). */
export function cardTile(page: Page, cardName: string, variantNumber: string): Locator {
  return page.getByRole('button', { name: new RegExp(`${escapeRegExp(cardName)}.*${escapeRegExp(variantNumber)}`) });
}

export function addToCollectionButton(page: Page, cardName: string, variantNumber: string): Locator {
  return cardTile(page, cardName, variantNumber).getByLabel(`Add ${cardName} to collection`, {
    exact: true,
  });
}

export function addOneButton(page: Page, cardName: string, variantNumber: string): Locator {
  return cardTile(page, cardName, variantNumber).getByLabel(`Add one ${cardName}`, { exact: true });
}

export function removeOneButton(page: Page, cardName: string, variantNumber: string): Locator {
  return cardTile(page, cardName, variantNumber).getByLabel(`Remove one ${cardName}`, {
    exact: true,
  });
}

export function printingOption(page: Page, variantNumber: string): Locator {
  return page.getByTestId(`printing-option-${variantNumber}`);
}

export async function pickPrinting(page: Page, variantNumber: string): Promise<void> {
  const option = printingOption(page, variantNumber);
  await expect(option).toBeVisible();
  await option.click();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
