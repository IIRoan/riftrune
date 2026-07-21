import { expect, test } from '@playwright/test';
import { prepareSignedIn, goToTab } from './helpers/session';

test.describe('settings · shared collection', () => {
  test.beforeEach(async ({ context, page }) => {
    await prepareSignedIn(context, page, '/settings');
  });

  test('create invite link then cancel it', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Create invite link' })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole('button', { name: 'Create invite link' }).click();

    await expect(page.getByLabel('Copy invite link')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible();
    await expect(page.getByText('/invite/')).toBeVisible();

    await page.getByText('Cancel', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create invite link' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('theme choices are interactive', async ({ page }) => {
    await goToTab(page, 'Settings');
    await page.getByText('Light', { exact: true }).click();
    await page.getByText('Dark', { exact: true }).click();
    await expect(page.getByText('Shared collection', { exact: true })).toBeVisible();
  });
});
