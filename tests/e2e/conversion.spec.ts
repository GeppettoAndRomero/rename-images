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

test.describe('tap-to-order rename + zip', () => {
  test('renames in the tapped/reordered sequence, preserves each extension, uploads nothing', async ({ page }) => {
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

    // "Select all remaining" assigns numbers in grid/upload order: blue, red, green.
    await page.click('#select-all-action');

    const grid = page.getByRole('list', { name: /uploaded/i });
    const cardFor = (name: string) => grid.getByRole('listitem').filter({ hasText: name });

    // Grid DOM order is fixed (upload order), independent of sequence order — so
    // assertions look up each card by filename, not by position in the grid.
    // Default template {n:03} previews 001/002/003 in the order tapped.
    await expect(cardFor('blue.jpg')).toContainText('001.jpg');
    await expect(cardFor('red.jpg')).toContainText('002.jpg');
    await expect(cardFor('green.png')).toContainText('003.png');

    // Move green to the front with its own up button, twice.
    const greenUp = cardFor('green.png').getByRole('button', { name: /move up/i });
    await greenUp.click();
    await greenUp.click();
    // Order is now: green, blue, red.
    await expect(cardFor('green.png')).toContainText('001.png');
    await expect(cardFor('blue.jpg')).toContainText('002.jpg');
    await expect(cardFor('red.jpg')).toContainText('003.jpg');

    // Custom template + a non-default start number.
    await page.fill('#rename-template', 'photo-{n:02}');
    await page.fill('#rename-start', '5');

    // Live preview reflects the new template before any download happens.
    await expect(cardFor('green.png')).toContainText('photo-05.png');
    await expect(cardFor('blue.jpg')).toContainText('photo-06.jpg');
    await expect(cardFor('red.jpg')).toContainText('photo-07.jpg');

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.click('#download-action');
    const download = await downloadPromise;
    // Zip filename follows the naming template ("photo-{n:02}" -> "photo.zip"),
    // not a fixed generic name.
    expect(download.suggestedFilename()).toBe('photo.zip');

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
    await page.click('#select-all-action'); // must be selected for the template check to even run

    await page.fill('#rename-template', 'photo');
    await expect(page.getByRole('alert')).toContainText(/sequence number/i);
    await expect(page.locator('#download-action')).toBeDisabled();
  });

  test('download is disabled with nothing selected and enables once items are added', async ({ page }) => {
    await page.goto('/rename-images/');
    await waitReady(page);
    await dropFixtures(page);

    await expect(page.locator('#download-action')).toBeDisabled();
    const grid = page.getByRole('list', { name: /uploaded/i });
    await expect(grid.getByRole('listitem')).toHaveCount(3);
    await expect(grid.getByRole('button', { pressed: true })).toHaveCount(0);

    await page.click('#select-all-action');
    await expect(page.locator('#download-action')).toBeEnabled();
  });

  test('tapping a numbered thumbnail again removes it from the sequence; discarding removes it entirely', async ({ page }) => {
    await page.goto('/rename-images/');
    await waitReady(page);
    await dropFixtures(page);
    await page.click('#select-all-action');

    const grid = page.getByRole('list', { name: /uploaded/i });
    const greenCard = grid.getByRole('listitem').filter({ hasText: 'green.png' });
    // The toggle button's accessible name always starts with the filename; the
    // discard (×) button's name is just "Discard", so matching by name avoids
    // ambiguity with pressed:false also matching buttons with no aria-pressed at all.
    const greenToggle = greenCard.getByRole('button', { name: /^green\.png/i });
    await greenToggle.click(); // tap the numbered thumbnail again

    await expect(greenToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(grid.getByRole('listitem')).toHaveCount(3); // still in the grid, just unselected

    await greenCard.getByRole('button', { name: /discard/i }).click();
    await expect(grid.getByRole('listitem')).toHaveCount(2);
    await expect(page.getByText('green.png')).toHaveCount(0);
  });
});
