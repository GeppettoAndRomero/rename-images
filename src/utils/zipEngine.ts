/**
 * Bundle a rename plan into a .zip, entirely in the browser (@zip.js/zip.js, no server).
 * Windows-safe filenames: useUnicodeFileNames sets the UTF-8 "language encoding" flag
 * (general-purpose bit 11), so non-ASCII names extract correctly in Windows Explorer.
 */
import { ZipWriter, BlobWriter, BlobReader } from '@zip.js/zip.js';
import type { RenamePlanItem } from './renameEngine';

export async function zipRenamedFiles(plan: RenamePlanItem[]): Promise<Blob> {
  const writer = new ZipWriter(new BlobWriter('application/zip'), {
    useUnicodeFileNames: true,
  });
  for (const item of plan) {
    await writer.add(item.name, new BlobReader(item.file));
  }
  return writer.close();
}
