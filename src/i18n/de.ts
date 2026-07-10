import type { ToolContent } from './types';

// Deutsch. Keine Wort-für-Wort-Übersetzung, sondern Transkreation auf Basis der
// Begriffe und Wendungen, die deutsche Batch-Umbenennungs-Tools tatsächlich verwenden.
// Keine Werbefloskeln (einfach / schnell / kinderleicht / perfekt) — Datenschutz
// wird strukturell begründet, nicht versprochen (BRAND-OPERATING-MODEL /
// I18N-SEO-GUIDELINE). Register: informelles „du", wie bei kostenlosen Browser-Tools üblich.

export const de: ToolContent = {
  htmlLang: 'de',

  meta: {
    title: 'Bilder durchnummerieren — sortieren & umbenennen, ohne Upload | runlocally',
    description:
      'Mehrere Fotos ablegen, in der gewünschten Reihenfolge antippen und alle durchnummerierten als .zip herunterladen — direkt im Browser. Dateiendungen bleiben unverändert. Nichts wird hochgeladen.',
    ogTitle: 'Bilder durchnummerieren — sortieren & umbenennen',
    ogDescription:
      'Foto-Miniaturansichten in der gewünschten Reihenfolge antippen, ein Benennungsmuster festlegen und alle durchnummerierten Dateien als .zip herunterladen. Nichts wird hochgeladen.',
  },

  hero: {
    h1: 'Bilder durchnummerieren',
    tagline:
      'Tippe deine Fotos in der gewünschten Reihenfolge an, lege ein Benennungsmuster fest und lade alle durchnummeriert als .zip herunter — im Browser. Dateiendungen bleiben immer erhalten.',
  },

  intro: {
    h2: 'Fotos durch Antippen in Serie umbenennen',
    paras: [
      'Exporte von Kamera oder Smartphone landen selten in der gewünschten Reihenfolge, und Dutzende Dateien einzeln umzubenennen ist mühsam. Dieses Tool zeigt jedes Bild als Miniaturansicht — tippe sie in der gewünschten Reihenfolge an, genau wie bei der Mehrfachauswahl von Fotos auf dem Smartphone, und jedes erhält eine Nummer. Nur durchnummerierte Fotos werden anschließend passend dazu umbenannt — in einem Schritt.',
      'Das Benennungsmuster ist eine kleine Vorlage: Schreibe {n} an die Stelle, an der die laufende Nummer stehen soll, oder {n:03}, um sie auf eine feste Stellenzahl aufzufüllen (001, 002, ...). Alles andere in der Vorlage wird genauso übernommen, wie du es eingibst. Die ursprüngliche Dateiendung bleibt immer exakt erhalten — geändert wird nur der Dateiname selbst.',
    ],
  },

  privacy: {
    h2: 'Warum deine Fotos auf dem Gerät bleiben',
    lead: 'Datenschutz ist hier strukturell, kein Versprechen. Es gibt keinen Upload-Schritt, weil es keinen Server gibt, zu dem etwas hochgeladen werden könnte:',
    points: [
      'Miniaturansichten und Umbenennung laufen vollständig in deinem Browser.',
      'Die Seite wird als statische Dateien ausgeliefert und sendet keine Anfrage mit deinen Bilddaten.',
      'Der Quellcode ist offen und kann von allen eingesehen werden (MIT).',
      'Die Seite funktioniert offline – was nur möglich ist, weil nichts das Gerät verlässt.',
    ],
    note: 'Wenn du es selbst prüfen willst, öffne beim Umbenennen das Netzwerk-Panel deines Browsers – keine Anfrage trägt deine Dateien.',
    sourceLinkText: 'Quellcode ansehen.',
  },

  howto: {
    h2: 'So funktioniert es',
    steps: [
      {
        h3: 'Bilder hinzufügen',
        p: 'Klicke, um Dateien auszuwählen, oder ziehe sie irgendwo auf die Seite. Jedes Bild landet unnummeriert in einem gemeinsamen Raster. Mehrere Dateien auf einmal sind möglich.',
      },
      {
        h3: 'Fotos in Reihenfolge antippen',
        p: 'Tippe ein Foto an, um ihm die nächste Nummer zu geben — genau die Geste, die du von der Mehrfachauswahl auf dem Smartphone kennst. "Alle restlichen auswählen" nummeriert alles auf einmal, in der Reihenfolge, in der es hinzugefügt wurde.',
      },
      {
        h3: 'Reihenfolge feinabstimmen',
        p: 'Ziehe ein durchnummeriertes Foto, um es zu verschieben, oder nutze seine Auf/Ab-Schaltflächen. Tippst du ein durchnummeriertes Foto erneut an, verliert es seine Nummer — es bleibt im Raster, nichts geht verloren.',
      },
      {
        h3: 'Benennungsmuster festlegen',
        p: 'Gib eine Vorlage mit {n} an der Stelle der laufenden Nummer ein (z. B. IMG_{n:04}), oder wähle eine Vorlage aus den Vorschlägen. Eine Live-Vorschau zeigt jeden neuen Dateinamen sofort an.',
      },
      {
        h3: '.zip herunterladen',
        p: 'Jedes durchnummerierte Foto wird passend zu seiner Position umbenannt und in eine .zip-Datei gepackt — unnummerierte Fotos bleiben außen vor, Dateiendungen werden nie geändert.',
      },
    ],
  },

  faqHeading: 'Häufige Fragen',
  faq: [
    {
      q: 'Werden meine Fotos irgendwohin hochgeladen?',
      a: 'Nein. Sortieren, Umbenennen und Packen in ein .zip laufen vollständig in deinem Browser. Es gibt keine Serverkomponente, also gibt es für deine Dateien keinen Weg vom Gerät. Der Quellcode ist offen und du kannst das im Netzwerk-Panel deines Browsers nachprüfen.',
    },
    {
      q: 'Ändert sich die Dateiendung?',
      a: 'Nein. Das Benennungsmuster steuert nur den Dateinamen selbst (den Teil vor dem letzten Punkt). Egal ob .jpg, .JPG, .png oder .webp — die Endung bleibt exakt erhalten.',
    },
    {
      q: 'Wie funktioniert das Benennungsmuster?',
      a: 'Schreibe {n} an die Stelle, an der die laufende Nummer stehen soll, oder {n:03}, um sie auf eine feste Stellenzahl aufzufüllen (aus 1, 2, 3 werden dann 001, 002, 003). Alles andere, was du eingibst — Buchstaben, Bindestriche, Unterstriche — wird unverändert übernommen. Zum Beispiel ergibt photo-{n:03} die Namen photo-001, photo-002, photo-003 und so weiter.',
    },
    {
      q: 'Was passiert, wenn zwei Dateien denselben Namen erhalten würden?',
      a: 'Das kann nicht passieren. Jedes durchnummerierte Foto erhält eine eigene, unterschiedliche Position, und die Vorlage muss {n} enthalten — fehlt es, blockiert das Tool den Download mit einer klaren Meldung. Zwei unterschiedliche Positionen können strukturell nie denselben Namen ergeben.',
    },
    {
      q: 'Werden die Bilder bearbeitet oder neu kodiert?',
      a: 'Nein. Die Bilddaten selbst werden nicht verändert — nur der Dateiname ändert sich. Qualität, Metadaten und Dateigröße bleiben genau wie im Original.',
    },
    {
      q: 'Funktioniert es offline?',
      a: 'Ja. Das Tool ist eine PWA. Nach dem ersten Besuch wird es zwischengespeichert, sodass es ohne Netzwerkverbindung funktioniert. Du kannst es auch zum Startbildschirm hinzufügen.',
    },
  ],

  footer: {
    openSourceLabel: 'Open Source (MIT)',
    partOf: 'Teil von',
    brandTail: '— kleine Tools, die lokal auf deinem Gerät laufen.',
    colophon:
      'Erstellt und gepflegt von Geppetto. Ein Teil des Codes entsteht mit KI-Unterstützung; Prüfung und Entscheidungen liegen beim Maintainer.',
    securityText: 'Sicherheit',
  },
};
