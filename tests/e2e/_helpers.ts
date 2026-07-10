import { type Page, type Download } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

export const RED_JPG_B64 = readFileSync(
  fileURLToPath(new URL('../fixtures/images/red.jpg', import.meta.url))
).toString('base64');

/** Wait until the island has hydrated and the rename subsystem is ready. */
export async function waitReady(page: Page) {
  await page.waitForFunction(() => (window as Record<string, unknown>).__toolReady === true);
}

/**
 * Drop a single image through the same path the drop zone uses, then click
 * download with the default naming template ({n:03}) and return the resulting
 * .zip download. Used by generic (engine-independent) covenant/i18n checks;
 * conversion.spec.ts drives the reorder+rename engine itself in more detail.
 */
export async function convert(page: Page): Promise<Download> {
  await page.evaluate((b64) => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const file = new File([bytes], 'sample.jpg', { type: 'image/jpeg' });
    window.dispatchEvent(new CustomEvent('filesDropped', { detail: [file] }));
  }, RED_JPG_B64);
  // Dropped files land in the grid unselected; select them before downloading
  // is possible. "#select-all-action" is an id (locale-independent), unlike
  // the visible button text, so this helper works on every /<locale>/ route.
  await page.locator('#select-all-action').waitFor({ state: 'visible' });
  await page.locator('#select-all-action').click();
  await page.locator('#download-action').waitFor({ state: 'visible' });
  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await page.locator('#download-action').click();
  return downloadPromise;
}
