import type { ToolContent } from './types';

export const en: ToolContent = {
  htmlLang: 'en',

  meta: {
    title: 'Rename Images in Sequence — Reorder & Batch Rename, No Upload | runlocally',
    description:
      'Drop several photos, tap them in the order you want, and download every numbered one renamed in sequence as a .zip — right in your browser. Extensions are kept unchanged. Nothing is uploaded.',
    ogTitle: 'Rename Images in Sequence — Reorder & Batch Rename',
    ogDescription:
      'Tap photo thumbnails in the order you want, set a naming pattern, and download every numbered file renamed in sequence as a .zip. Nothing is uploaded.',
  },

  hero: {
    h1: 'Rename Images in Sequence',
    tagline:
      'Tap your photos in the order you want, set a naming pattern, and download them all renumbered as a .zip — in your browser. Extensions never change.',
  },

  intro: {
    h2: 'Batch-rename photos by tapping them in order',
    paras: [
      'Camera and phone exports rarely land in the order you want them, and manually renaming dozens of files one by one is tedious. This tool shows every image as a thumbnail — tap them in the order you want, the same way you multi-select photos on your phone, and a numbered badge appears on each one. Only numbered photos get renamed, all at once, to match that order.',
      'The naming pattern is a small template: write {n} where the sequence number should go, or {n:03} to pad it to a fixed number of digits (001, 002, ...). Everything else in the template is copied as typed. The original file extension is always kept exactly as it was — only the base name changes.',
    ],
  },

  privacy: {
    h2: 'Why your photos stay on your device',
    lead: 'Privacy here is structural, not a promise. There is no upload step because there is no server to upload to:',
    points: [
      'Thumbnails and renaming happen entirely in your browser.',
      'The page is served as static files and makes no request with your image data.',
      'The source is open and anyone can read it (MIT).',
      'It works offline, which is only possible because nothing leaves the device.',
    ],
    note: "If you want to check for yourself, open your browser's Network panel while renaming — no request carries your files.",
    sourceLinkText: 'Read the source.',
  },

  howto: {
    h2: 'How to use it',
    steps: [
      {
        h3: 'Add your images',
        p: 'Click to choose files, or drop them anywhere on the page. Every photo lands in one grid, unnumbered; multiple files at once is fine.',
      },
      {
        h3: 'Tap photos in order',
        p: 'Tap a photo to give it the next number — the same gesture as multi-selecting photos on your phone. "Select all remaining" numbers everything at once, in the order it was added.',
      },
      {
        h3: 'Fine-tune the order',
        p: 'Drag a numbered photo to move it, or use its ↑/↓ buttons. Tapping a numbered photo again removes its number — it stays right there in the grid, so nothing is lost.',
      },
      {
        h3: 'Set the naming pattern',
        p: 'Type a template with {n} where the sequence number goes (e.g. IMG_{n:04}), or pick one of the presets. A live preview shows each new filename as you type.',
      },
      {
        h3: 'Download the .zip',
        p: 'Every numbered photo is renamed to match its position and bundled into one .zip — unnumbered photos are left out, and extensions are never changed.',
      },
    ],
  },

  faqHeading: 'FAQ',
  faq: [
    {
      q: 'Are my photos uploaded anywhere?',
      a: "No. Reordering, renaming and zipping all happen entirely in your browser. There is no server component, so your files have no path off your device. The source is open and you can confirm this in your browser's Network panel.",
    },
    {
      q: 'Does it change the file extension?',
      a: 'No. The naming template only controls the base name (the part before the last dot). Whatever extension a file had — .jpg, .JPG, .png, .webp — is kept exactly as it was.',
    },
    {
      q: 'How does the naming template work?',
      a: 'Write {n} anywhere you want the sequence number to appear, or {n:03} to zero-pad it to a fixed width (so 1, 2, 3 become 001, 002, 003). Anything else you type — letters, dashes, underscores — is copied as-is. For example, photo-{n:03} produces photo-001, photo-002, photo-003, and so on.',
    },
    {
      q: 'What happens if two files would end up with the same name?',
      a: "It can't happen. Every numbered photo gets a distinct position, and the template must contain {n} — the tool blocks download with a clear message until it does. Two different positions can never render the same name.",
    },
    {
      q: 'Does it edit or re-encode the images?',
      a: 'No. The image bytes are never touched — only the filename changes. This keeps quality, metadata and file size exactly as they were.',
    },
    {
      q: 'Does it work offline?',
      a: 'Yes. It is a PWA. After the first visit it is cached, so it works without a network connection. You can also install it to your home screen.',
    },
  ],

  footer: {
    openSourceLabel: 'Open source (MIT)',
    partOf: 'part of',
    brandTail: '— small tools that run locally on your device.',
    colophon:
      "Built and maintained by Geppetto. Some code is written with AI assistance; all review and decisions are the maintainer's.",
    securityText: 'Security',
  },
};
