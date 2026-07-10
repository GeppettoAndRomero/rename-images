import { describe, it, expect } from 'vitest';
import { AppError, resolveErrorMessage } from '@/utils/appError';
import { ui } from '@/i18n/ui';

describe('resolveErrorMessage', () => {
  it('maps codes to localized strings, with param substitution', () => {
    expect(resolveErrorMessage(new AppError('errTemplateEmpty'), ui.en)).toBe(
      'Enter a naming template.'
    );
    expect(resolveErrorMessage(new AppError('errTemplateNoSequence'), ui.ja)).toBe(
      'テンプレートに連番が必要です。{n} または {n:03} を追加してください。'
    );
    expect(resolveErrorMessage(new AppError('errUnsupported', { name: 'notes.txt' }), ui.en)).toBe(
      'Not an image file (notes.txt).'
    );
  });

  it('falls back to the localized generic message for unmapped/undefined errors', () => {
    expect(resolveErrorMessage('some internal error', ui.zh)).toBe(ui.zh.errConversionFailed);
    expect(resolveErrorMessage(undefined, ui.es)).toBe(ui.es.errConversionFailed);
  });

  it('every locale defines the mapped codes', () => {
    for (const loc of ['en', 'ja', 'zh', 'de', 'es'] as const)
      for (const c of ['errUnsupported', 'errConversionFailed', 'errTemplateEmpty', 'errTemplateNoSequence'])
        expect((ui as any)[loc][c], `${loc}.${c}`).toBeTruthy();
  });
});
