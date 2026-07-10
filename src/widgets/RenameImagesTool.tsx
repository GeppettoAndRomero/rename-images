/**
 * RenameImagesTool.
 * Drop several images, drag the thumbnails into the order you want, set a naming
 * template, and download every file renamed in sequence — as a .zip. Extensions are
 * always kept as-is; only the base name is templated.
 *
 * Role split: renameEngine.ts (the template → filename logic, pure/testable) and
 * zipEngine.ts (bundling, @zip.js/zip.js) do the real work; this widget is the
 * drag-and-drop grid + template field + wiring, same shape as pdf-merge's
 * ConversionManager but for images (no async thumbnail render needed — the browser
 * decodes the image directly via an object URL).
 */
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';
import { AppField } from './AppField';
import { ErrorToast } from './ErrorToast';
import { isAcceptedImage } from '@/utils/fileValidation';
import { buildRenamePlan, TEMPLATE_PRESETS, type RenamePlanItem } from '@/utils/renameEngine';
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
  const [files, setFiles] = useState<File[]>([]);
  const [template, setTemplate] = useState('{n:03}');
  const [startAt, setStartAt] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errorToasts, setErrorToasts] = useState<ErrorToastItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const filesRef = useRef<File[]>([]);
  filesRef.current = files;
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
    const live = new Set(files.map(fileKey));
    for (const [key, url] of thumbUrls.current) {
      if (!live.has(key)) {
        URL.revokeObjectURL(url);
        thumbUrls.current.delete(key);
      }
    }
  }, [files]);
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
      if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
      window.dispatchEvent(new CustomEvent('filesProcessed'));
    },
    [showErrorToast, t]
  );

  useEffect(() => {
    const handler = (e: Event) => addFiles((e as CustomEvent<File[]>).detail);
    window.addEventListener('filesDropped', handler);
    return () => window.removeEventListener('filesDropped', handler);
  }, [addFiles]);

  const move = (i: number, dir: -1 | 1) =>
    setFiles((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const removeAt = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));
  const clearAll = () => setFiles([]);

  const reorderTo = (from: number, to: number) =>
    setFiles((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // Preview the plan live so the grid can show each file's upcoming new name, and the
  // download button can disable itself on a bad template without touching the engine.
  let plan: RenamePlanItem[] | null = null;
  let planError: string | null = null;
  try {
    plan = files.length ? buildRenamePlan(files, template, startAt) : [];
  } catch (error) {
    planError = resolveErrorMessage(error, t);
  }

  const handleDownload = useCallback(async () => {
    if (busy || !files.length) return;
    setBusy(true);
    try {
      const finalPlan = buildRenamePlan(filesRef.current, template, startAt);
      const blob = await zipRenamedFiles(finalPlan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'renamed-images.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      showErrorToast(resolveErrorMessage(error, t));
    } finally {
      setBusy(false);
    }
  }, [busy, files.length, template, startAt, showErrorToast, t]);

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

        {files.length > 0 && (
          <>
            <div
              role="list"
              aria-label={t.thumbGridAria ?? 'Image order'}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
              }}
            >
              {files.map((f, i) => {
                const newName = plan?.[i]?.name;
                const isDragging = dragIndex === i;
                const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
                return (
                  <div
                    key={fileKey(f)}
                    role="listitem"
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverIndex(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex !== null) reorderTo(dragIndex, i);
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                      padding: 'var(--space-2)',
                      border: `1px solid ${isOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-bg)',
                      opacity: isDragging ? 0.4 : 1,
                      cursor: 'grab',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1 / 1',
                        overflow: 'hidden',
                        borderRadius: '2px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    >
                      <img
                        src={thumbUrlFor(f)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <span
                        class="num"
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          background: 'var(--color-primary)',
                          color: '#fff',
                          borderRadius: '999px',
                          minWidth: '20px',
                          height: '20px',
                          fontSize: 'var(--fs-0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 5px',
                        }}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--fs-0)',
                        color: 'var(--color-subtle)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={f.name}
                    >
                      {f.name}
                    </div>
                    <div
                      class="num"
                      style={{
                        fontSize: 'var(--fs-1)',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={newName}
                    >
                      {newName ?? '—'}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="display: flex; gap: var(--space-1);">
                        <button
                          type="button"
                          aria-label={t.moveUp ?? 'Move up'}
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                          style="background:none;border:none;cursor:pointer;color:var(--color-primary);font-size:var(--fs-2);padding:2px;"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={t.moveDown ?? 'Move down'}
                          disabled={i === files.length - 1}
                          onClick={() => move(i, 1)}
                          style="background:none;border:none;cursor:pointer;color:var(--color-primary);font-size:var(--fs-2);padding:2px;"
                        >
                          ↓
                        </button>
                      </span>
                      <button
                        type="button"
                        aria-label={t.removeFile ?? 'Remove'}
                        onClick={() => removeAt(i)}
                        style="background:none;border:none;cursor:pointer;color:var(--color-danger);font-size:var(--fs-2);padding:2px;"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

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
          <span style="font-size: var(--fs-2); color: var(--color-subtle);" class="num">{files.length}</span>
          <span style="display: flex; gap: var(--space-2);">
            {files.length > 0 && (
              <AppButton variant="secondary" onClick={clearAll}>
                {t.clearAll}
              </AppButton>
            )}
            <button
              id="download-action"
              onClick={handleDownload}
              disabled={files.length === 0 || !!planError || busy}
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
