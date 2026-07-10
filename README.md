# rename-images

Drop several images, drag the thumbnails into the order you want, and download every
file renamed in sequence as a .zip — entirely in your browser. Files are processed on
your device and never uploaded. Open source, works offline (PWA).

Part of [runlocally](https://runlocally.app) — small tools that run locally on your device.

## How it works

Each dropped file gets an object URL (`URL.createObjectURL`) so the browser can render
its thumbnail directly — no decode/re-encode step, since only the filename changes.
Reordering is native HTML5 drag-and-drop, with up/down buttons as an accessible
alternative. The naming template (`{n}` / `{n:03}`) is a small pure-function engine
(`renameEngine.ts`) that maps each file's position to a new base name while keeping its
original extension untouched. The renamed files are bundled into a `.zip` with
[@zip.js/zip.js](https://github.com/gildas-lormeau/zip.js). The whole pipeline runs
client-side — there is no server component, so your files have no path off your device.

## Features

- Drag-and-drop (or up/down buttons) to reorder thumbnails
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
