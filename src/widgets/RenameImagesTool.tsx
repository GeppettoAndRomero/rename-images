/**
 * RenameImagesTool.
 * One grid of every uploaded thumbnail. Tap a thumbnail to give it the next
 * sequence number (like the native multi-select photo picker on iOS/Android);
 * tap an already-numbered thumbnail again to remove it from the sequence —
 * later numbers shift down automatically. Only numbered thumbnails are
 * renamed (via a template) and zipped; unnumbered ones just sit in the grid.
 * Numbered thumbnails can be fine-reordered by dragging (desktop) or with
 * ↑/↓ buttons (keyboard/touch/tests). Extensions are always kept as-is; only
 * the base name is templated.
 *
 * Role split: renameEngine.ts (the template → filename logic, pure/testable)
 * and zipEngine.ts (bundling, @zip.js/zip.js) do the real work; this widget
 * is the grid + tap/drag/button wiring + template field.
 */
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';
import { AppField } from './AppField';
import { ErrorToast } from './ErrorToast';
import { isAcceptedImage } from '@/utils/fileValidation';
import { buildRenamePlan, deriveZipName, TEMPLATE_PRESETS, type RenamePlanItem } from '@/utils/renameEngine';
import { zipRenamedFiles } from '@/utils/zipEngine';
import { resolveErrorMessage } from '@/utils/appError';
import { ui } from '@/i18n/ui';

interface ErrorToastItem {
  id: string;
  message: string;
}

interface RenameImagesToolProps {
  locale?: string;
}

/** Stable, reorder-independent key for a File (thumbnail object-URL cache, React keys). */
function fileKey(f: File): string {
  return `${f.name}__${f.size}__${f.lastModified}`;
}

export function RenameImagesTool({ locale = 'en' }: RenameImagesToolProps) {
  const t = (ui as any)[locale] ?? ui.en;
  const [allFiles, setAllFiles] = useState<File[]>([]); // every uploaded file, fixed upload order = grid order
  const [sequence, setSequence] = useState<File[]>([]); // ordered subset of allFiles; badge number = indexOf+1
  const [template, setTemplate] = useState('{n:03}');
  const [startAt, setStartAt] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errorToasts, setErrorToasts] = useState<ErrorToastItem[]>([]);
  // Drag state is File-reference based: every File the app holds is a distinct
  // instance, so `===` safely identifies it without tracking indices that
  // would go stale as the sequence changes length.
  const [dragFile, setDragFile] = useState<File | null>(null);
  const [overFile, setOverFile] = useState<File | null>(null);
  const sequenceRef = useRef<File[]>([]);
  sequenceRef.current = sequence;
  const thumbUrls = useRef<Map<string, string>>(new Map());

  const showErrorToast = useCallback((message: string) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    setErrorToasts((prev) => [...prev, { id, message }]);
  }, []);
  const removeErrorToast = useCallback((id: string) => {
    setErrorToasts((prev) => prev.filter((e) => e.id !== id));
  }, []);

  useEffect(() => {
    (globalThis as Record<string, unknown>).__toolReady = true;
  }, []);

  // Object URLs are cheap and synchronous (unlike PDF page rendering) — mint one per
  // file the first time it's seen, revoke it when the file is finally discarded.
  const thumbUrlFor = (f: File): string => {
    const key = fileKey(f);
    let url = thumbUrls.current.get(key);
    if (!url) {
      url = URL.createObjectURL(f);
      thumbUrls.current.set(key, url);
    }
    return url;
  };
  useEffect(() => {
    const live = new Set(allFiles.map(fileKey));
    for (const [key, url] of thumbUrls.current) {
      if (!live.has(key)) {
        URL.revokeObjectURL(url);
        thumbUrls.current.delete(key);
      }
    }
  }, [allFiles]);
  useEffect(() => {
    return () => {
      for (const url of thumbUrls.current.values()) URL.revokeObjectURL(url);
    };
  }, []);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const accepted = incoming.filter(isAcceptedImage);
      const rejected = incoming.filter((f) => !isAcceptedImage(f));
      if (rejected.length) showErrorToast(t.errUnsupported.replace('{name}', rejected[0].name));
      if (accepted.length) setAllFiles((prev) => [...prev, ...accepted]);
      window.dispatchEvent(new CustomEvent('filesProcessed'));
    },
    [showErrorToast, t]
  );

  useEffect(() => {
    const handler = (e: Event) => addFiles((e as CustomEvent<File[]>).detail);
    window.addEventListener('filesDropped', handler);
    return () => window.removeEventListener('filesDropped', handler);
  }, [addFiles]);

  // --- sequence-only reordering (up/down buttons) -------------------------
  const move = (i: number, dir: -1 | 1) =>
    setSequence((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // --- tap to add/remove from the sequence --------------------------------
  const toggleFile = (file: File) =>
    setSequence((prev) => {
      const idx = prev.indexOf(file);
      if (idx === -1) return [...prev, file]; // unselected -> append, becomes the highest number
      const next = [...prev];
      next.splice(idx, 1); // selected -> remove; splice shifts everyone after it down automatically
      return next;
    });
  const selectAllRemaining = () =>
    setSequence((prev) => {
      const already = new Set(prev);
      const remaining = allFiles.filter((f) => !already.has(f));
      return remaining.length ? [...prev, ...remaining] : prev;
    });
  const discardFile = (file: File) => {
    setAllFiles((prev) => prev.filter((f) => f !== file));
    setSequence((prev) => prev.filter((f) => f !== file));
  };
  const clearAll = () => {
    setAllFiles([]);
    setSequence([]);
  };

  // --- drag plumbing (reordering among already-numbered thumbnails only) --
  const resetDragState = () => {
    setDragFile(null);
    setOverFile(null);
  };
  const onDragStart = (file: File) => setDragFile(file);
  const onDragOver = (e: DragEvent, file: File) => {
    e.preventDefault(); // required, or the browser refuses to allow a drop here
    setOverFile(file);
  };
  const onDrop = (e: DragEvent, targetFile: File) => {
    e.preventDefault();
    if (dragFile && dragFile !== targetFile) {
      setSequence((prev) => {
        const from = prev.indexOf(dragFile);
        const to = prev.indexOf(targetFile);
        if (from === -1 || to === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    }
    resetDragState();
  };

  // Preview the plan live so each numbered card can show its upcoming new
  // name, and the download button can disable itself on a bad template
  // without touching the engine.
  let plan: RenamePlanItem[] | null = null;
  let planError: string | null = null;
  try {
    plan = sequence.length ? buildRenamePlan(sequence, template, startAt) : [];
  } catch (error) {
    planError = resolveErrorMessage(error, t);
  }

  const handleDownload = useCallback(async () => {
    if (busy || !sequence.length) return;
    setBusy(true);
    try {
      const finalPlan = buildRenamePlan(sequenceRef.current, template, startAt);
      const blob = await zipRenamedFiles(finalPlan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = deriveZipName(template);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      showErrorToast(resolveErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  }, [busy, sequence.length, template, startAt, showErrorToast, t]);

  // Precomputed once per render so each card's badge lookup is O(1), not O(n).
  const seqIndex = new Map<File, number>();
  sequence.forEach((f, i) => seqIndex.set(f, i));

  return (
    <div>
      <AppCard>
        <div style="margin-bottom: var(--space-4);">
          <h3 style="margin: 0 0 var(--space-1) 0; font-size: var(--fs-4); font-weight: 600;">
            {t.uploadHeading}
          </h3>
          <p style="margin: 0; font-size: var(--fs-2); color: var(--color-subtle);">
            {t.uploadSubtitle}
          </p>
        </div>

        <div
          style={{
            padding: 'var(--space-6)',
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            textAlign: 'center',
            marginBottom: 'var(--space-4)',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div style="font-size: 3rem; margin-bottom: var(--space-2);">🖼️</div>
          <div style="font-size: var(--fs-3); font-weight: 600; margin-bottom: var(--space-2);">
            {t.dropClick}
          </div>
          <div style="font-size: var(--fs-1); color: var(--color-subtle);">{t.dropOr}</div>
          <div style="font-size: var(--fs-1); color: var(--color-subtle); margin-top: var(--space-1);">
            {t.dropSupported}
          </div>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              addFiles(Array.from(e.currentTarget.files || []));
              e.currentTarget.value = '';
            }}
            style="display: none;"
          />
        </div>

        {allFiles.length > 0 && (
          <>
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:var(--space-2);margin-bottom:var(--space-2);flex-wrap:wrap;">
              <p style="margin:0;font-size:var(--fs-1);color:var(--color-subtle);">
                {t.gridHint}{' '}
                <span class="num">
                  {t.selectedCountLabel.replace('{selected}', String(sequence.length)).replace('{total}', String(allFiles.length))}
                </span>
              </p>
              {sequence.length < allFiles.length && (
                <button
                  id="select-all-action"
                  type="button"
                  class="app-button app-button--secondary"
                  onClick={selectAllRemaining}
                >
                  {t.selectAllRemaining}
                </button>
              )}
            </div>

            <div role="list" aria-label={t.gridAria} class="rn-grid">
              {allFiles.map((f) => {
                const pos = seqIndex.get(f);
                const selected = pos !== undefined;
                const newName = selected ? plan?.[pos as number]?.name : undefined;
                const isDragging = selected && dragFile === f;
                const isOver = selected && overFile === f && dragFile !== f;
                const ariaLabel = selected
                  ? t.thumbSelectedAria
                      .replace('{name}', f.name)
                      .replace('{n}', String((pos as number) + 1))
                      .replace('{count}', String(sequence.length))
                      .replace('{newName}', newName ?? '—')
                  : t.thumbUnselectedAria.replace('{name}', f.name);
                return (
                  <div
                    key={fileKey(f)}
                    role="listitem"
                    style={{ position: 'relative', opacity: isDragging ? 0.4 : 1 }}
                    draggable={selected}
                    onDragStart={selected ? () => onDragStart(f) : undefined}
                    onDragOver={selected ? (e: DragEvent) => onDragOver(e, f) : undefined}
                    onDrop={selected ? (e: DragEvent) => onDrop(e, f) : undefined}
                    onDragEnd={resetDragState}
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={ariaLabel}
                      onClick={() => toggleFile(f)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-1)',
                        padding: 'var(--space-2)',
                        border: `2px solid ${isOver ? 'var(--color-primary)' : selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: selected ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-bg))' : 'var(--color-bg)',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          overflow: 'hidden',
                          borderRadius: '2px',
                          background: 'var(--color-surface)',
                        }}
                      >
                        <img
                          src={thumbUrlFor(f)}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: selected ? '1' : '0.85' }}
                        />
                      </span>
                      <span
                        class="num"
                        style={{ fontSize: 'var(--fs-1)', color: 'var(--color-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                        title={f.name}
                      >
                        {f.name}
                      </span>
                      {selected && (
                        <span
                          class="num"
                          style={{ fontSize: 'var(--fs-1)', fontWeight: 600, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                          title={newName}
                        >
                          {newName ?? '—'}
                        </span>
                      )}
                    </button>

                    {selected && (
                      <span
                        aria-hidden="true"
                        class="num"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                          color: 'var(--color-primary-ink)',
                          fontSize: 'var(--fs-1)',
                          fontWeight: 700,
                          lineHeight: '22px',
                          textAlign: 'center',
                        }}
                      >
                        {(pos as number) + 1}
                      </span>
                    )}

                    <button
                      type="button"
                      aria-label={t.discardFile}
                      onClick={() => discardFile(f)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'color-mix(in srgb, var(--color-bg) 70%, transparent)',
                        color: 'var(--color-danger)',
                        fontSize: 'var(--fs-1)',
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>

                    {selected && (
                      <span style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex', gap: '2px' }}>
                        <button
                          type="button"
                          aria-label={t.moveUp}
                          disabled={pos === 0}
                          onClick={() => move(pos as number, -1)}
                          class="rn-step"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={t.moveDown}
                          disabled={pos === sequence.length - 1}
                          onClick={() => move(pos as number, 1)}
                          class="rn-step"
                        >
                          ↓
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <style>{`
              .rn-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
                gap: var(--space-2);
                margin-bottom: var(--space-4);
              }
              .rn-step {
                width: 20px;
                height: 20px;
                line-height: 1;
                font-size: var(--fs-1);
                background: var(--color-bg);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-xs);
                color: var(--color-primary);
                cursor: pointer;
              }
              .rn-step:disabled {
                opacity: 0.4;
                cursor: not-allowed;
              }
            `}</style>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                alignItems: 'flex-end',
                marginBottom: 'var(--space-2)',
              }}
            >
              <div style="flex: 1 1 220px;">
                <AppField
                  id="rename-template"
                  label={t.templateLabel ?? 'Naming template'}
                  value={template}
                  onChange={(v) => setTemplate(String(v))}
                  placeholder="{n:03}"
                  helpText={t.templateHelp}
                  locale={locale}
                />
              </div>
              <div style="flex: 0 0 120px;">
                <AppField
                  id="rename-start"
                  label={t.startAtLabel ?? 'Start at'}
                  type="number"
                  min={0}
                  value={startAt}
                  onChange={(v) => setStartAt(Number(v))}
                  locale={locale}
                />
              </div>
            </div>

            <div style="display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3);">
              {TEMPLATE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  class="num"
                  onClick={() => setTemplate(preset)}
                  style={{
                    border: '1px solid var(--color-border)',
                    background: template === preset ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: template === preset ? '#fff' : 'var(--color-text)',
                    borderRadius: '999px',
                    padding: '4px 12px',
                    fontSize: 'var(--fs-0)',
                    cursor: 'pointer',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            {planError && (
              <p role="alert" style="color: var(--color-danger); font-size: var(--fs-1); margin: 0 0 var(--space-3) 0;">
                {planError}
              </p>
            )}
          </>
        )}

        <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-3);">
          <span style="font-size: var(--fs-2); color: var(--color-subtle);" class="num">{sequence.length}</span>
          <span style="display: flex; gap: var(--space-2);">
            {allFiles.length > 0 && (
              <AppButton variant="secondary" onClick={clearAll}>
                {t.clearAll}
              </AppButton>
            )}
            <button
              id="download-action"
              onClick={handleDownload}
              disabled={sequence.length === 0 || !!planError || busy}
              class="app-button app-button--primary"
            >
              {busy ? (t.zipping ?? 'Zipping…') : (t.downloadZip ?? 'Download .zip')}
            </button>
          </span>
        </div>
      </AppCard>

      {errorToasts.length > 0 && (
        <div className="error-toast-container" aria-label={t.notificationsAria}>
          {errorToasts.map((toast) => (
            <ErrorToast key={toast.id} id={toast.id} message={toast.message} onClose={removeErrorToast} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
