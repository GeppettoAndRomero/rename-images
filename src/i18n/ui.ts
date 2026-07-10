/**
 * Preact アイランド（クライアント UI）の文言。ロケール別。
 * ページレベル content (`en.ts` / `ja.ts`) とは別に、インタラクティブな
 * アイランドが表示する文字列をここに集約する。
 *
 * 重要: アイランドは locale を PROP で受け取り（SSR 時に存在）、
 * `document` 等から読まない。SSR とクライアントで同一文字列を描画して
 * hydration mismatch を防ぐ。
 *
 * 補間文字列は `{name}` / `{count}` のテンプレートを持ち、
 * アイランド側で `.replace('{name}', x)` する。
 */
export const ui = {
  en: {
    // RenameImagesTool
    uploadHeading: 'Add images',
    uploadSubtitle: 'Choose the photos you want to rename.',
    dropClick: 'Click to choose files',
    dropOr: 'or drop files anywhere on the page',
    dropSupported: 'Supported: JPG, PNG, WebP, GIF, AVIF, BMP, SVG',
    gridAria: 'Uploaded images',
    gridHint: 'Tap photos in the order you want to rename them.',
    selectedCountLabel: '{selected} of {total} selected',
    selectAllRemaining: 'Select all remaining',
    thumbUnselectedAria: '{name}. Tap to add to the rename sequence.',
    thumbSelectedAria: '{name}, position {n} of {count}, will be renamed to {newName}. Tap to remove from the sequence.',
    discardFile: 'Discard',
    moveUp: 'Move up',
    moveDown: 'Move down',
    clearAll: 'Clear all',
    templateLabel: 'Naming template',
    templateHelp: 'Use {n} for the sequence number, or {n:03} to pad it (001, 002, ...).',
    startAtLabel: 'Start at',
    downloadZip: 'Download .zip',
    zipping: 'Zipping…',
    notificationsAria: 'Notifications',
    errUnsupported: 'Not an image file ({name}).',
    errConversionFailed: 'Something went wrong',
    errTemplateEmpty: 'Enter a naming template.',
    errTemplateNoSequence:
      'The template needs a sequence number — add {n} or {n:03} to it.',

    // InstallPrompt
    installHeading: 'Install app',
    installBody: 'Add to your home screen for quick access.',
    install: 'Install',
    later: 'Later',

    // GlobalDropZone
    dzProcessing: 'Adding {count} file(s)...',
    dzPleaseWait: 'Please wait',
    dzDropTitle: 'Drop images to add them',
    dzDropSub: 'They will be added to the list below',

    // ThemeToggle
    themeToLight: 'Switch to light mode',
    themeToDark: 'Switch to dark mode',
    themeLabel: 'Theme',

    // shared
    close: 'Close',
    required: 'Required',
  },
  ja: {
    // RenameImagesTool
    uploadHeading: '画像を追加',
    uploadSubtitle: 'リネームしたい写真を選んでください。',
    dropClick: 'クリックして選択',
    dropOr: 'またはページ上にドロップ',
    dropSupported: '対応形式: JPG, PNG, WebP, GIF, AVIF, BMP, SVG',
    gridAria: 'アップロード済みの画像',
    gridHint: 'タップした順に画像がリネームされます。',
    selectedCountLabel: '{total}件中{selected}件選択中',
    selectAllRemaining: '残り全部を選択',
    thumbUnselectedAria: '{name}。タップしてシーケンスに追加。',
    thumbSelectedAria: '{name}、{count}件中{n}番目。{newName}にリネームされます。タップして解除。',
    discardFile: '削除',
    moveUp: '上へ移動',
    moveDown: '下へ移動',
    clearAll: 'すべてクリア',
    templateLabel: '命名パターン',
    templateHelp: '連番には {n} を、桁数を揃えるには {n:03} のように書きます（001, 002, ...）。',
    startAtLabel: '開始番号',
    downloadZip: 'ZIP をダウンロード',
    zipping: '作成中…',
    notificationsAria: '通知',
    errUnsupported: '画像ファイルではありません（{name}）。',
    errConversionFailed: '問題が発生しました',
    errTemplateEmpty: '命名パターンを入力してください。',
    errTemplateNoSequence: 'テンプレートに連番が必要です。{n} または {n:03} を追加してください。',

    // InstallPrompt
    installHeading: 'アプリを追加',
    installBody: 'ホーム画面に追加すると、すぐに開けます。',
    install: '追加',
    later: 'あとで',

    // GlobalDropZone
    dzProcessing: '{count} 件のファイルを追加中…',
    dzPleaseWait: 'お待ちください',
    dzDropTitle: 'ドロップして追加',
    dzDropSub: '下の一覧に追加されます',

    // ThemeToggle
    themeToLight: 'ライトモードに切り替え',
    themeToDark: 'ダークモードに切り替え',
    themeLabel: 'テーマ',

    // shared
    close: '閉じる',
    required: '必須',
  },
  zh: {
    // RenameImagesTool
    uploadHeading: '添加图片',
    uploadSubtitle: '选择要重命名的照片。',
    dropClick: '点击选择文件',
    dropOr: '或把文件拖到页面任意位置',
    dropSupported: '支持格式：JPG、PNG、WebP、GIF、AVIF、BMP、SVG',
    gridAria: '已上传的图片',
    gridHint: '按点击顺序为图片重命名。',
    selectedCountLabel: '已选择 {selected}/{total}',
    selectAllRemaining: '选择剩余全部',
    thumbUnselectedAria: '{name}。点击以加入重命名序列。',
    thumbSelectedAria: '{name}，第 {n}/{count} 位，将重命名为 {newName}。点击以移出序列。',
    discardFile: '删除',
    moveUp: '上移',
    moveDown: '下移',
    clearAll: '全部清除',
    templateLabel: '命名规则',
    templateHelp: '用 {n} 表示序号，或用 {n:03} 补零到固定位数（001、002……）。',
    startAtLabel: '起始编号',
    downloadZip: '下载 ZIP',
    zipping: '正在打包…',
    notificationsAria: '通知',
    errUnsupported: '不是图片文件（{name}）。',
    errConversionFailed: '出了点问题',
    errTemplateEmpty: '请输入命名规则。',
    errTemplateNoSequence: '模板需要包含序号——请添加 {n} 或 {n:03}。',

    // InstallPrompt
    installHeading: '安装应用',
    installBody: '添加到主屏幕，方便随时打开。',
    install: '安装',
    later: '以后再说',

    // GlobalDropZone
    dzProcessing: '正在添加 {count} 个文件…',
    dzPleaseWait: '请稍候',
    dzDropTitle: '拖放即可添加',
    dzDropSub: '将添加到下方列表',

    // ThemeToggle
    themeToLight: '切换到浅色模式',
    themeToDark: '切换到深色模式',
    themeLabel: '主题',

    // shared
    close: '关闭',
    required: '必填',
  },
  de: {
    // RenameImagesTool
    uploadHeading: 'Bilder hinzufügen',
    uploadSubtitle: 'Wähle die Fotos aus, die du umbenennen möchtest.',
    dropClick: 'Zum Auswählen klicken',
    dropOr: 'oder Dateien irgendwo auf die Seite ziehen',
    dropSupported: 'Unterstützt: JPG, PNG, WebP, GIF, AVIF, BMP, SVG',
    gridAria: 'Hochgeladene Bilder',
    gridHint: 'Tippe die Fotos in der gewünschten Reihenfolge an, um sie umzubenennen.',
    selectedCountLabel: '{selected} von {total} ausgewählt',
    selectAllRemaining: 'Alle restlichen auswählen',
    thumbUnselectedAria: '{name}. Tippen, um es zur Umbenennungssequenz hinzuzufügen.',
    thumbSelectedAria: '{name}, Position {n} von {count}, wird zu {newName} umbenannt. Tippen, um es aus der Sequenz zu entfernen.',
    discardFile: 'Verwerfen',
    moveUp: 'Nach oben',
    moveDown: 'Nach unten',
    clearAll: 'Alle entfernen',
    templateLabel: 'Benennungsmuster',
    templateHelp: 'Nutze {n} für die laufende Nummer oder {n:03}, um sie aufzufüllen (001, 002, ...).',
    startAtLabel: 'Beginnen bei',
    downloadZip: '.zip herunterladen',
    zipping: 'Wird gepackt…',
    notificationsAria: 'Benachrichtigungen',
    errUnsupported: 'Keine Bilddatei ({name}).',
    errConversionFailed: 'Etwas ist schiefgelaufen',
    errTemplateEmpty: 'Gib ein Benennungsmuster ein.',
    errTemplateNoSequence: 'Die Vorlage braucht eine laufende Nummer — füge {n} oder {n:03} hinzu.',

    // InstallPrompt
    installHeading: 'App installieren',
    installBody: 'Zum Startbildschirm hinzufügen, um es direkt zu öffnen.',
    install: 'Installieren',
    later: 'Später',

    // GlobalDropZone
    dzProcessing: '{count} Datei(en) werden hinzugefügt …',
    dzPleaseWait: 'Bitte warten',
    dzDropTitle: 'Bilder zum Hinzufügen ablegen',
    dzDropSub: 'Sie werden zur Liste unten hinzugefügt',

    // ThemeToggle
    themeToLight: 'Zum hellen Modus wechseln',
    themeToDark: 'Zum dunklen Modus wechseln',
    themeLabel: 'Design',

    // shared
    close: 'Schließen',
    required: 'Erforderlich',
  },
  es: {
    // RenameImagesTool
    uploadHeading: 'Añadir imágenes',
    uploadSubtitle: 'Elige las fotos que quieres renombrar.',
    dropClick: 'Haz clic para elegir archivos',
    dropOr: 'o suelta archivos en cualquier parte de la página',
    dropSupported: 'Compatibles: JPG, PNG, WebP, GIF, AVIF, BMP, SVG',
    gridAria: 'Imágenes subidas',
    gridHint: 'Toca las fotos en el orden en que quieras renombrarlas.',
    selectedCountLabel: '{selected} de {total} seleccionadas',
    selectAllRemaining: 'Seleccionar el resto',
    thumbUnselectedAria: '{name}. Toca para añadirla a la secuencia de renombrado.',
    thumbSelectedAria: '{name}, posición {n} de {count}, se renombrará a {newName}. Toca para quitarla de la secuencia.',
    discardFile: 'Descartar',
    moveUp: 'Subir',
    moveDown: 'Bajar',
    clearAll: 'Quitar todo',
    templateLabel: 'Patrón de nombres',
    templateHelp: 'Usa {n} para el número de secuencia, o {n:03} para rellenarlo con ceros (001, 002, ...).',
    startAtLabel: 'Empezar en',
    downloadZip: 'Descargar .zip',
    zipping: 'Empaquetando…',
    notificationsAria: 'Notificaciones',
    errUnsupported: 'No es un archivo de imagen ({name}).',
    errConversionFailed: 'Algo salió mal',
    errTemplateEmpty: 'Escribe un patrón de nombres.',
    errTemplateNoSequence: 'La plantilla necesita un número de secuencia: añade {n} o {n:03}.',

    // InstallPrompt
    installHeading: 'Instalar la app',
    installBody: 'Añádela a tu pantalla de inicio para tenerla siempre a mano.',
    install: 'Instalar',
    later: 'Más tarde',

    // GlobalDropZone
    dzProcessing: 'Añadiendo {count} archivo(s)...',
    dzPleaseWait: 'Espera un momento',
    dzDropTitle: 'Suelta las imágenes para añadirlas',
    dzDropSub: 'Se añadirán a la lista de abajo',

    // ThemeToggle
    themeToLight: 'Cambiar al modo claro',
    themeToDark: 'Cambiar al modo oscuro',
    themeLabel: 'Tema',

    // shared
    close: 'Cerrar',
    required: 'Obligatorio',
  },
} as const;

export type UiStrings = (typeof ui)['en'];
