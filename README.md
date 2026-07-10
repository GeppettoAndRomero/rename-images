# rename-images

Drop several images into one grid, tap them in the order you want to rename them (like
the multi-select photo picker on your phone — a numbered badge appears on each tap), and
download every numbered photo renamed as a .zip — entirely in your browser. Files are
processed on your device and never uploaded. Open source, works offline (PWA).

Part of [runlocally](https://runlocally.app) — small tools that run locally on your device.

## How it works

Every uploaded photo sits in one grid. Tapping an unnumbered photo gives it the next
sequence number; tapping an already-numbered photo removes it and the rest renumber
automatically — only numbered photos get renamed and zipped, everything else just sits in
the grid. Numbered photos can be fine-reordered by dragging on desktop, or with ↑/↓
buttons that work everywhere (mouse, touch, keyboard) — deliberately not drag-only, since
native HTML5 drag-and-drop doesn't work reliably on touchscreens. Removing a photo's
number is reversible (it stays in the grid, tap it again to re-add); a separate discard
button (×) removes it from the tool entirely.

Each file gets an object URL (`URL.createObjectURL`) so the browser can render its
thumbnail directly — no decode/re-encode step, since only the filename changes. The naming
template (`{n}` / `{n:03}`) is a small pure-function engine (`renameEngine.ts`) that maps
each sequence position to a new base name while keeping its original extension untouched.
The renamed files are bundled into a `.zip` with
[@zip.js/zip.js](https://github.com/gildas-lormeau/zip.js), named after the naming
template itself (`photo-{n:02}` downloads as `photo.zip`; a template that's only the
placeholder falls back to `renamed-images.zip`). The whole pipeline runs client-side —
there is no server component, so your files have no path off your device.

## Features

- Tap-to-order single grid: no separate lists, order is built by tap sequence (numbered badges)
- Fully usable by tap alone — no drag required, so it works the same on desktop and mobile
- Drag-and-drop (or up/down buttons) to fine-reorder already-numbered photos
- Reversible: removing a number keeps the photo in the grid; discard (×) removes it for good
- Naming template with a sequence placeholder: `{n}` or zero-padded `{n:03}`
- Custom start number
- File extensions are always preserved exactly as they were
- Works offline (PWA), installable

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
