import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { waitReady } from './_helpers';

const FIXTURES = {
  red: fileURLToPath(new URL('../fixtures/images/red.jpg', import.meta.url)),
  green: fileURLToPath(new URL('../fixtures/images/green.png', import.meta.url)),
  blue: fileURLToPath(new URL('../fixtures/images/blue.jpg', import.meta.url)),
};

const isZip = (b: Buffer) => b[0] === 0x50 && b[1] === 0x4b; // local file header 'PK'
const containsAscii = (b: Buffer, s: string) => b.includes(Buffer.from(s, 'ascii'));

/** Drop the three fixtures, in this deliberately non-alphabetical order. */
async function dropFixtures(page: import('@playwright/test').Page) {
  const files = [
    { path: FIXTURES.blue, name: 'blue.jpg', type: 'image/jpeg' },
    { path: FIXTURES.red, name: 'red.jpg', type: 'image/jpeg' },
    { path: FIXTURES.green, name: 'green.png', type: 'image/png' },
  ];
  const encoded = files.map((f) => ({
    ...f,
    b64: readFileSync(f.path).toString('base64'),
  }));
  await page.evaluate((items) => {
    const toFile = (b64: string, name: string, type: string) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new File([bytes], name, { type });
    };
    const detail = items.map((it) => toFile(it.b64, it.name, it.type));
    window.dispatchEvent(new CustomEvent('filesDropped', { detail }));
  }, encoded);
}

test.describe('rename + reorder + zip', () => {
  test('renames in the reordered sequence, preserves each extension, uploads nothing', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost:4321') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        external.push(url);
      }
    });

    await page.goto('/rename-images/');
    await waitReady(page);
    await dropFixtures(page);

    // Dropped files land in the pool first; move them all into the sequence.
    await page.click('#add-all-action');

    // Dropped order is blue, red, green. "Add all" preserves that order into the
    // sequence. Default template {n:03} previews 001.jpg/002.jpg/003.png.
    const sequence = page.getByRole('list', { name: /sequence/i });
    await expect(sequence.getByText('blue.jpg')).toBeVisible();
    await expect(sequence.getByText('001.jpg', { exact: true })).toBeVisible();

    // Move the last item (green.png) to the front with the up button, twice.
    const items = sequence.getByRole('listitem');
    await expect(items).toHaveCount(3);
    const greenItem = items.filter({ hasText: 'green.png' });
    await greenItem.getByRole('button', { name: /move up/i }).click();
    await greenItem.getByRole('button', { name: /move up/i }).click();
    // Order is now: green, blue, red.
    await expect(items.nth(0)).toContainText('green.png');
    await expect(items.nth(1)).toContainText('blue.jpg');
    await expect(items.nth(2)).toContainText('red.jpg');

    // Custom template + a non-default start number.
    await page.fill('#rename-template', 'photo-{n:02}');
    await page.fill('#rename-start', '5');

    // Live preview reflects the new template before any download happens.
    await expect(items.nth(0)).toContainText('photo-05.png'); // green.png, extension kept
    await expect(items.nth(1)).toContainText('photo-06.jpg'); // blue.jpg
    await expect(items.nth(2)).toContainText('photo-07.jpg'); // red.jpg

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.click('#download-action');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);

    const buf = readFileSync((await download.path()) as string);
    expect(isZip(buf)).toBe(true);
    // The renamed entries are in the zip...
    expect(containsAscii(buf, 'photo-05.png')).toBe(true);
    expect(containsAscii(buf, 'photo-06.jpg')).toBe(true);
    expect(containsAscii(buf, 'photo-07.jpg')).toBe(true);
    // ...and the original filenames are gone, not kept as aliases.
    expect(containsAscii(buf, 'green.png')).toBe(false);
    expect(containsAscii(buf, 'blue.jpg')).toBe(false);
    expect(containsAscii(buf, 'red.jpg')).toBe(false);

    expect(external, `unexpected cross-origin requests: ${external.join(', ')}`).toHaveLength(0);
  });

  test('blocks download and shows an error when the template has no sequence placeholder', async ({ page }) => {
    await page.goto('/rename-images/');
    await waitReady(page);
    await dropFixtures(page);
    await page.click('#add-all-action'); // must be in the sequence for the template check to even run

    await page.fill('#rename-template', 'photo');
    await expect(page.getByRole('alert')).toContainText(/sequence number/i);
    await expect(page.locator('#download-action')).toBeDisabled();
  });

  test('download is disabled with an empty sequence and enables once items are added', async ({ page }) => {
    await page.goto('/rename-images/');
    await waitReady(page);
    await dropFixtures(page);

    await expect(page.locator('#download-action')).toBeDisabled();
    await expect(page.getByRole('list', { name: /uploaded/i }).getByRole('listitem')).toHaveCount(3);
    // No role="list" is rendered for the sequence column while it's empty (an
    // empty-state placeholder is shown instead) — see the widget's JSX.
    await expect(page.getByRole('list', { name: /sequence/i })).toHaveCount(0);

    await page.click('#add-all-action');
    await expect(page.locator('#download-action')).toBeEnabled();
  });

  test('removing from the sequence returns a file to the pool; discarding from the pool removes it entirely', async ({ page }) => {
    await page.goto('/rename-images/');
    await waitReady(page);
    await dropFixtures(page);
    await page.click('#add-all-action');

    const sequence = page.getByRole('list', { name: /sequence/i });
    const greenSeqItem = sequence.getByRole('listitem').filter({ hasText: 'green.png' });
    await greenSeqItem.getByRole('button', { name: /back to pool/i }).click();

    await expect(sequence.getByRole('listitem')).toHaveCount(2);
    const pool = page.getByRole('list', { name: /uploaded/i });
    const greenPoolItem = pool.getByRole('listitem').filter({ hasText: 'green.png' });
    await expect(greenPoolItem).toBeVisible();

    await greenPoolItem.getByRole('button', { name: /discard/i }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'green.png' })).toHaveCount(0);
  });
});
