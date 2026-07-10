/**
 * RenameImagesTool.
 * Two columns: uploaded images land in the left "pool"; dragging (or the +/Add all
 * button) moves them into the right "sequence" in the order placed, where they can
 * be reordered (drag or ↑/↓) and renamed via a template, then downloaded as a .zip.
 * Only the sequence is zipped — the pool is a staging area, not included. Extensions
 * are always kept as-is; only the base name is templated.
 *
 * Role split: renameEngine.ts (the template → filename logic, pure/testable) and
 * zipEngine.ts (bundling, @zip.js/zip.js) do the real work; this widget is the
 * two-list drag-and-drop UI + template field + wiring, same shape as pdf-merge's
 * ConversionManager but for images (no async thumbnail render needed — the browser
 * decodes the image directly via an object URL).
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
  const [pool, setPool] = useState<File[]>([]);
  const [sequence, setSequence] = useState<File[]>([]);
  const [template, setTemplate] = useState('{n:03}');
  const [startAt, setStartAt] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errorToasts, setErrorToasts] = useState<ErrorToastItem[]>([]);
  // Drag state is File-reference based (not index-based): a drag can now cross
  // from the pool into the sequence, so an index captured at dragstart would go
  // stale the moment either list's length changes. Every File the app holds is a
  // distinct instance never duplicated across the two lists, so `===` is safe.
  const [dragSource, setDragSource] = useState<'pool' | 'sequence' | null>(null);
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
  // file the first time it's seen, revoke it when the file is finally dropped from the list.
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
    const live = new Set([...pool, ...sequence].map(fileKey));
    for (const [key, url] of thumbUrls.current) {
      if (!live.has(key)) {
        URL.revokeObjectURL(url);
        thumbUrls.current.delete(key);
      }
    }
  }, [pool, sequence]);
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
      if (accepted.length) setPool((prev) => [...prev, ...accepted]);
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

  // --- cross-list moves -----------------------------------------------------
  const moveToSequence = (file: File) => {
    setPool((prev) => prev.filter((f) => f !== file));
    setSequence((prev) => [...prev, file]);
  };
  const addAllToSequence = () => {
    setPool((prev) => {
      if (prev.length) setSequence((seq) => [...seq, ...prev]);
      return [];
    });
  };
  const removeFromSequence = (file: File) => {
    setSequence((prev) => prev.filter((f) => f !== file));
    setPool((prev) => [...prev, file]);
  };
  const discardFromPool = (file: File) => setPool((prev) => prev.filter((f) => f !== file));
  const clearAll = () => {
    setPool([]);
    setSequence([]);
  };

  // --- drag plumbing ---------------------------------------------------------
  const resetDragState = () => {
    setDragSource(null);
    setDragFile(null);
    setOverFile(null);
  };
  const onPoolDragStart = (file: File) => {
    setDragSource('pool');
    setDragFile(file);
  };
  const onSequenceDragStart = (file: File) => {
    setDragSource('sequence');
    setDragFile(file);
  };
  const onSequenceItemDragOver = (e: DragEvent, file: File) => {
    e.preventDefault(); // required, or the browser refuses to allow a drop here
    setOverFile(file);
  };
  const onSequenceItemDrop = (e: DragEvent, targetFile: File) => {
    e.preventDefault();
    e.stopPropagation(); // stop the container-level handler below from double-processing this same drop
    if (dragSource === 'sequence' && dragFile && dragFile !== targetFile) {
      setSequence((prev) => {
        const from = prev.indexOf(dragFile);
        const to = prev.indexOf(targetFile);
        if (from === -1 || to === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    } else if (dragSource === 'pool' && dragFile) {
      moveToSequence(dragFile); // any pool->sequence drag always appends to the end
    }
    resetDragState();
  };
  // Catches drops on empty space / the empty-state placeholder, so dropping a
  // pool item anywhere in the sequence pane works, not just on top of a row.
  const onSequenceContainerDragOver = (e: DragEvent) => {
    e.preventDefault();
  };
  const onSequenceContainerDrop = (e: DragEvent) => {
    e.preventDefault();
    if (dragSource === 'pool' && dragFile) moveToSequence(dragFile);
    resetDragState();
  };

  // Preview the plan live so the sequence list can show each file's upcoming new
  // name, and the download button can disable itself on a bad template without
  // touching the engine.
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

        {(pool.length > 0 || sequence.length > 0) && (
          <>
            <div class="rn-columns">
              {/* ---- LEFT: pool (uploaded, not yet sequenced) ---- */}
              <div class="rn-column">
                <div style="display:flex;justify-content:space-between;align-items:baseline;gap:var(--space-2);margin-bottom:var(--space-1);">
                  <h4 style="margin:0;font-size:var(--fs-3);font-weight:600;">
                    {t.poolHeading} <span class="num" style="color:var(--color-subtle);font-size:var(--fs-1);">{pool.length}</span>
                  </h4>
                  {pool.length > 0 && (
                    <button
                      id="add-all-action"
                      type="button"
                      class="app-button app-button--secondary"
                      onClick={addAllToSequence}
                    >
                      {t.addAllToSequence}
                    </button>
                  )}
                </div>

                {pool.length > 0 ? (
                  <div role="list" aria-label={t.poolListAria} style="display:flex;flex-direction:column;gap:var(--space-2);">
                    {pool.map((f) => (
                      <div
                        key={fileKey(f)}
                        role="listitem"
                        draggable
                        onDragStart={() => onPoolDragStart(f)}
                        onDragEnd={resetDragState}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          opacity: dragFile === f ? 0.4 : 1,
                          cursor: 'grab',
                        }}
                      >
                        <span style="display:flex;align-items:center;gap:var(--space-3);min-width:0;">
                          <span
                            aria-hidden="true"
                            class="rn-thumb"
                            style={{ flexShrink: '0', width: '34px', height: '46px', border: '1px solid var(--color-border)', borderRadius: '2px', background: 'var(--color-surface)' }}
                          >
                            <img src={thumbUrlFor(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <img class="rn-thumb__preview" src={thumbUrlFor(f)} alt="" />
                          </span>
                          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--fs-2);" title={f.name}>
                            {f.name}
                          </span>
                        </span>
                        <span style="display:flex;gap:var(--space-1);align-items:center;flex-shrink:0;">
                          <button
                            type="button"
                            aria-label={t.addToSequence}
                            onClick={() => moveToSequence(f)}
                            style="background:none;border:none;cursor:pointer;color:var(--color-primary);font-size:var(--fs-2);padding:2px;"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            aria-label={t.discardFile}
                            onClick={() => discardFromPool(f)}
                            style="background:none;border:none;cursor:pointer;color:var(--color-danger);font-size:var(--fs-2);padding:2px;"
                          >
                            ×
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style="padding:var(--space-4);border:1px dashed var(--color-border);border-radius:var(--radius-sm);color:var(--color-subtle);font-size:var(--fs-1);text-align:center;">
                    {t.poolEmptyHint}
                  </div>
                )}
              </div>

              {/* ---- RIGHT: sequence (what gets renamed + zipped) ---- */}
              <div class="rn-column" onDragOver={onSequenceContainerDragOver} onDrop={onSequenceContainerDrop}>
                <h4 style="margin:0 0 var(--space-1) 0;font-size:var(--fs-3);font-weight:600;">
                  {t.sequenceHeading} <span class="num" style="color:var(--color-subtle);font-size:var(--fs-1);">{sequence.length}</span>
                </h4>

                {sequence.length > 0 ? (
                  <div role="list" aria-label={t.sequenceListAria} style="display:flex;flex-direction:column;gap:var(--space-2);">
                    {sequence.map((f, i) => {
                      const newName = plan?.[i]?.name;
                      const isDragging = dragSource === 'sequence' && dragFile === f;
                      const isOver = overFile === f && dragFile !== f;
                      return (
                        <div
                          key={fileKey(f)}
                          role="listitem"
                          draggable
                          onDragStart={() => onSequenceDragStart(f)}
                          onDragOver={(e) => onSequenceItemDragOver(e, f)}
                          onDrop={(e) => onSequenceItemDrop(e, f)}
                          onDragEnd={resetDragState}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-2) var(--space-3)',
                            background: 'var(--color-bg)',
                            border: `1px solid ${isOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-sm)',
                            opacity: isDragging ? 0.4 : 1,
                            cursor: 'grab',
                          }}
                        >
                          <span style="display:flex;align-items:center;gap:var(--space-3);min-width:0;">
                            <span
                              aria-hidden="true"
                              class="rn-thumb"
                              style={{ flexShrink: '0', width: '34px', height: '46px', border: '1px solid var(--color-border)', borderRadius: '2px', background: 'var(--color-surface)' }}
                            >
                              <img src={thumbUrlFor(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              <img class="rn-thumb__preview" src={thumbUrlFor(f)} alt="" />
                            </span>
                            <span style="min-width:0;overflow:hidden;">
                              <span
                                style={{
                                  fontSize: 'var(--fs-1)',
                                  color: 'var(--color-subtle)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                }}
                                title={f.name}
                              >
                                <span class="num">{i + 1}.</span> {f.name}
                              </span>
                              <span
                                class="num"
                                style={{
                                  fontSize: 'var(--fs-2)',
                                  fontWeight: 600,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                }}
                                title={newName}
                              >
                                {newName ?? '—'}
                              </span>
                            </span>
                          </span>
                          <span style="display:flex;gap:var(--space-1);align-items:center;flex-shrink:0;">
                            <button
                              type="button"
                              aria-label={t.moveUp}
                              disabled={i === 0}
                              onClick={() => move(i, -1)}
                              style="background:none;border:none;cursor:pointer;color:var(--color-primary);font-size:var(--fs-2);padding:2px;"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              aria-label={t.moveDown}
                              disabled={i === sequence.length - 1}
                              onClick={() => move(i, 1)}
                              style="background:none;border:none;cursor:pointer;color:var(--color-primary);font-size:var(--fs-2);padding:2px;"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              aria-label={t.backToPool}
                              onClick={() => removeFromSequence(f)}
                              style="background:none;border:none;cursor:pointer;color:var(--color-danger);font-size:var(--fs-2);padding:2px;"
                            >
                              ↩
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style="padding:var(--space-4);border:1px dashed var(--color-border);border-radius:var(--radius-sm);color:var(--color-subtle);font-size:var(--fs-1);text-align:center;">
                    {t.sequenceEmptyHint}
                  </div>
                )}
              </div>
            </div>

            <style>{`
              .rn-columns {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--space-4);
                margin-bottom: var(--space-4);
              }
              .rn-column {
                display: flex;
                flex-direction: column;
                gap: var(--space-2);
                min-width: 0;
              }
              @media (max-width: 640px) {
                .rn-columns {
                  grid-template-columns: 1fr;
                }
              }
              .rn-thumb {
                position: relative;
                overflow: hidden;
              }
              .rn-thumb:hover {
                overflow: visible;
                z-index: 5;
              }
              .rn-thumb__preview {
                position: absolute;
                bottom: calc(100% + 6px);
                left: 0;
                width: 140px;
                height: 140px;
                object-fit: cover;
                border: 1px solid var(--color-border);
                border-radius: var(--radius-sm);
                box-shadow: var(--shadow-2);
                background: var(--color-surface);
                opacity: 0;
                pointer-events: none;
                transform: scale(0.92);
                transform-origin: bottom left;
                transition: opacity var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
                z-index: 20;
              }
              .rn-thumb:hover .rn-thumb__preview {
                opacity: 1;
                transform: scale(1);
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
            {(pool.length > 0 || sequence.length > 0) && (
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
