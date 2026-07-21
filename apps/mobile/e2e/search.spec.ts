import { expect, test } from '@playwright/test';
import { FOIL_CARD, cardTile, searchForCard } from './helpers/collection';
import { prepareSignedIn } from './helpers/session';

test.describe('search', () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareSignedIn(context, page, '/search');
  });

  test('query finds a card and clear resets the field', async ({ page }) => {
    await searchForCard(page, FOIL_CARD.query, FOIL_CARD.name);
    await expect(cardTile(page, FOIL_CARD.name, FOIL_CARD.standardId)).toBeVisible();

    await page.getByLabel('Clear search').click();
    await expect(
      page.getByPlaceholder('Search cards, artists, tags, or set numbers')
    ).toHaveValue('');
  });

  test('focusing search clears the input but keeps current results until typing', async ({
    page,
  }) => {
    await searchForCard(page, FOIL_CARD.query, FOIL_CARD.name);
    await expect(cardTile(page, FOIL_CARD.name, FOIL_CARD.standardId)).toBeVisible();

    const search = page.getByPlaceholder('Search cards, artists, tags, or set numbers');
    await search.blur();
    await search.click();
    await expect(search).toHaveValue('');
    await expect(cardTile(page, FOIL_CARD.name, FOIL_CARD.standardId)).toBeVisible();

    await search.pressSequentially('zzz-no-card-should-match-this-ui-e2e-999', { delay: 15 });
    await expect(page.getByText('No cards found')).toBeVisible({ timeout: 30_000 });
  });

  test('opening a tile populates the detail panel', async ({ page }) => {
    await searchForCard(page, FOIL_CARD.query, FOIL_CARD.name);
    await cardTile(page, FOIL_CARD.name, FOIL_CARD.standardId).click();
    await expect(page.getByRole('button', { name: 'Wishlist card' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(FOIL_CARD.standardId, { exact: true }).first()).toBeVisible();
  });

  test('nonsense query yields an empty state', async ({ page }) => {
    const search = page.getByPlaceholder('Search cards, artists, tags, or set numbers');
    await search.fill('zzz-no-card-should-match-this-ui-e2e-999');
    await expect(page.getByText('No cards found')).toBeVisible({
      timeout: 30_000,
    });
  });
});
