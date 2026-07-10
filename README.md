# rename-images

Drop several images into the Uploaded pool, drag (or add) them into the Sequence in the
order you want, and download every file in the Sequence renamed as a .zip — entirely in
your browser. Files are processed on your device and never uploaded. Open source, works
offline (PWA).

Part of [runlocally](https://runlocally.app) — small tools that run locally on your device.

## How it works

Two columns: uploads land in the **pool** first, not included in the output. Dragging a
pool item into the **sequence** (or clicking its + button, or "Add all") moves it there,
appended in the order placed — only the sequence gets renamed and zipped. Removing a
sequence item sends it back to the pool (reversible); discarding a pool item deletes it.
The sequence itself supports drag reordering and up/down buttons, both kept working since
Playwright can't reliably simulate native drag-and-drop, so the button path stays the
tested one.

Each file gets an object URL (`URL.createObjectURL`) so the browser can render its
thumbnail directly — no decode/re-encode step, since only the filename changes. The naming
template (`{n}` / `{n:03}`) is a small pure-function engine (`renameEngine.ts`) that maps
each sequence position to a new base name while keeping its original extension untouched.
The renamed files are bundled into a `.zip` with
[@zip.js/zip.js](https://github.com/gildas-lormeau/zip.js). The whole pipeline runs
client-side — there is no server component, so your files have no path off your device.

## Features

- Two-column pool → sequence model: uploads stage in a pool; only the sequence is renamed and zipped
- Drag-and-drop (or +/Add all/back-to-pool buttons) to move files between the two lists
- Drag-and-drop (or up/down buttons) to reorder the sequence
- Naming template with a sequence placeholder: `{n}` or zero-padded `{n:03}`
- Custom start number
- File extensions are always preserved exactly as they were
- Works offline (PWA), installable

## Layout deviation (HANDBOOK.md §15.9)

This tool widens `--size-container` to 680px (fleet default: ~440px) to fit the two
columns side by side on desktop; below 640px width they stack into one column, matching
the fleet's existing mobile-first breakpoint. Noted here per §15.9 — no separate sign-off
required for a per-tool layout deviation, just a recorded rationale.

## Develop

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build to dist/
```

Stack: Astro + Preact + TypeScript. No Web Worker — renaming/zipping is cheap enough to
run on the main thread.

## License

[MIT](./LICENSE). Built and maintained by Geppetto. Some code is written with AI
assistance; all review and decisions are the maintainer's.
