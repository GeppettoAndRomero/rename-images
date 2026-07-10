/**
 * Sequential rename engine. Pure functions, no I/O — the caller supplies the
 * user's chosen order and a naming template, gets back the resulting filenames.
 *
 * Template syntax: `{n}` (sequence number) or `{n:03}` (zero-padded to 3 digits).
 * Anything else in the template is copied verbatim. The original extension is
 * always preserved and appended untouched — the template never supplies it.
 */
import { AppError } from './appError';

const PLACEHOLDER = /\{n(?::(\d+))?\}/g;
// Separate non-global regex for existence checks: .test() on a `g`-flagged
// regex advances its shared lastIndex on every call, so repeated checks
// (e.g. across renders) alternate true/false depending on prior calls.
// .replace() doesn't have this problem — it always resets lastIndex itself.
const PLACEHOLDER_TEST = /\{n(?::(\d+))?\}/;

/** Does the template contain at least one `{n}`/`{n:0X}` placeholder? */
export function templateHasSequence(template: string): boolean {
  return PLACEHOLDER_TEST.test(template);
}

/** Render one filename (without extension) for a given 1-based sequence number. */
export function renderTemplate(template: string, n: number): string {
  return template.replace(PLACEHOLDER, (_match, digits) => {
    const width = digits ? parseInt(digits, 10) : 0;
    return String(n).padStart(width, '0');
  });
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(dot) : ''; // includes the leading dot; no ext -> ''
}

export interface RenamePlanItem {
  file: File;
  name: string; // new filename, extension included
}

/**
 * Build the rename plan for `files` in the given order, starting at `startAt`.
 * Throws AppError('errTemplateEmpty') for a blank template, and
 * AppError('errTemplateNoSequence') if it has no {n} placeholder (every file
 * would collide on the same name). Beyond that check, every file gets a
 * distinct sequence number and `renderTemplate` never truncates, so the
 * rendered base names are always pairwise distinct — no further collision
 * check is needed.
 */
export function buildRenamePlan(
  files: File[],
  template: string,
  startAt: number
): RenamePlanItem[] {
  const trimmed = template.trim();
  if (!trimmed) throw new AppError('errTemplateEmpty');
  if (!templateHasSequence(trimmed)) throw new AppError('errTemplateNoSequence');

  return files.map((file, i) => ({
    file,
    name: `${renderTemplate(trimmed, startAt + i)}${extensionOf(file.name)}`,
  }));
}

/** A few real-world preset templates, shown as quick-pick chips in the UI. */
export const TEMPLATE_PRESETS = ['{n:03}', 'IMG_{n:04}', 'photo-{n:03}'] as const;

const FILENAME_UNSAFE = /[\\/:*?"<>|]/g;

/**
 * Turn the naming template into the downloaded .zip's base name, e.g.
 * "photo-{n:02}" -> "photo.zip", "IMG_{n:04}" -> "IMG.zip". Falls back to
 * "renamed-images.zip" when stripping the placeholder leaves nothing usable
 * (e.g. the template is just "{n:03}").
 */
export function deriveZipName(template: string): string {
  const base = template
    .replace(PLACEHOLDER, '')
    .replace(FILENAME_UNSAFE, '-')
    .trim()
    .replace(/^[-_.\s]+|[-_.\s]+$/g, '');
  return `${base || 'renamed-images'}.zip`;
}
