import { describe, it, expect } from 'vitest';
import { AppError } from '@/utils/appError';
import {
  buildRenamePlan,
  deriveZipName,
  renderTemplate,
  templateHasSequence,
} from '@/utils/renameEngine';

const f = (name: string): File => new File(['x'], name);

describe('templateHasSequence', () => {
  it('detects {n} and {n:0X} placeholders', () => {
    expect(templateHasSequence('{n}')).toBe(true);
    expect(templateHasSequence('IMG_{n:04}')).toBe(true);
    expect(templateHasSequence('no placeholder here')).toBe(false);
  });

  it('gives the same answer on repeated calls regardless of call order', () => {
    // Regression test: templateHasSequence used to run .test() on a shared
    // `g`-flagged regex, whose lastIndex persisted across calls and made
    // results alternate true/false for the *same* input across renders.
    for (let i = 0; i < 5; i++) {
      expect(templateHasSequence('{n:03}')).toBe(true);
      expect(templateHasSequence('{n:03}')).toBe(true);
      expect(templateHasSequence('no placeholder')).toBe(false);
    }
  });
});

describe('deriveZipName', () => {
  it('strips the placeholder and trailing separator to name the zip after the template', () => {
    expect(deriveZipName('photo-{n:02}')).toBe('photo.zip');
    expect(deriveZipName('IMG_{n:04}')).toBe('IMG.zip');
    expect(deriveZipName('{n:03}-vacation')).toBe('vacation.zip');
  });

  it('falls back to renamed-images.zip when nothing is left but the placeholder', () => {
    expect(deriveZipName('{n:03}')).toBe('renamed-images.zip');
    expect(deriveZipName('  {n}  ')).toBe('renamed-images.zip');
  });

  it('replaces filesystem-unsafe characters', () => {
    expect(deriveZipName('a/b:{n}')).toBe('a-b.zip');
  });
});

describe('renderTemplate', () => {
  it('substitutes a bare {n} with no padding', () => {
    expect(renderTemplate('{n}', 1)).toBe('1');
    expect(renderTemplate('{n}', 12)).toBe('12');
  });

  it('zero-pads {n:0X} to the requested width', () => {
    expect(renderTemplate('{n:03}', 1)).toBe('001');
    expect(renderTemplate('{n:03}', 42)).toBe('042');
    expect(renderTemplate('{n:03}', 1234)).toBe('1234'); // never truncates
  });

  it('keeps everything else in the template verbatim', () => {
    expect(renderTemplate('photo-{n:02}-final', 5)).toBe('photo-05-final');
  });
});

describe('buildRenamePlan', () => {
  it('names files in the given order, starting at startAt', () => {
    const plan = buildRenamePlan([f('a.jpg'), f('b.png'), f('c.jpg')], '{n:03}', 1);
    expect(plan.map((p) => p.name)).toEqual(['001.jpg', '002.png', '003.jpg']);
  });

  it('preserves the original extension exactly, including case', () => {
    const plan = buildRenamePlan([f('a.JPG'), f('b.PnG')], 'x-{n}', 1);
    expect(plan.map((p) => p.name)).toEqual(['x-1.JPG', 'x-2.PnG']);
  });

  it('honors a custom start number', () => {
    const plan = buildRenamePlan([f('a.jpg'), f('b.jpg')], 'IMG_{n:02}', 10);
    expect(plan.map((p) => p.name)).toEqual(['IMG_10.jpg', 'IMG_11.jpg']);
  });

  it('throws errTemplateEmpty for a blank/whitespace-only template', () => {
    expect(() => buildRenamePlan([f('a.jpg')], '', 1)).toThrow(AppError);
    expect(() => buildRenamePlan([f('a.jpg')], '   ', 1)).toThrow(
      expect.objectContaining({ code: 'errTemplateEmpty' })
    );
  });

  it('throws errTemplateNoSequence when the template has no {n}', () => {
    expect(() => buildRenamePlan([f('a.jpg'), f('b.jpg')], 'photo', 1)).toThrow(
      expect.objectContaining({ code: 'errTemplateNoSequence' })
    );
  });

  it('never produces duplicate names, even with duplicate input filenames', () => {
    // Two files sharing the same original name/extension still get distinct
    // sequence numbers, so their output names can't collide.
    const plan = buildRenamePlan([f('a.jpg'), f('a.jpg')], '{n:03}', 1);
    expect(plan.map((p) => p.name)).toEqual(['001.jpg', '002.jpg']);
  });

  it('does not throw for a well-formed template and unique inputs', () => {
    expect(() => buildRenamePlan([f('a.jpg'), f('b.jpg'), f('c.jpg')], '{n:03}', 1)).not.toThrow();
  });
});
