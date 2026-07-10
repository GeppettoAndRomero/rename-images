import type { ToolContent } from './types';

// Español. Transcreación basada en el vocabulario que usan las herramientas de
// renombrado por lotes en español, no traducción literal. Sin palabras publicitarias
// (fácil / rápido / perfecto…); la privacidad se explica de forma estructural, no como
// promesa. Español pan-regional (España y Latinoamérica), registro «tú». htmlLang 'es'.

export const es: ToolContent = {
  htmlLang: 'es',

  meta: {
    title: 'Renombrar imágenes en secuencia — reordenar y renombrar, sin subir nada | runlocally',
    description:
      'Suelta varias fotos, arrástralas al orden que quieras y descárgalas todas renombradas en secuencia como un .zip, directamente en tu navegador. Las extensiones no cambian. No se sube nada.',
    ogTitle: 'Renombrar imágenes en secuencia — reordenar y renombrar',
    ogDescription:
      'Reordena las miniaturas de tus fotos arrastrándolas, define un patrón de nombres y descarga todos los archivos renombrados en secuencia como un .zip. No se sube nada.',
  },

  hero: {
    h1: 'Renombrar imágenes en secuencia',
    tagline:
      'Arrastra tus fotos al orden que quieras, define un patrón de nombres y descárgalas todas renumeradas como un .zip, en tu navegador. Las extensiones nunca cambian.',
  },

  intro: {
    h2: 'Renombra fotos por lotes simplemente reordenándolas',
    paras: [
      'Las fotos que exportas de la cámara o del móvil casi nunca llegan en el orden que quieres, y renombrar decenas de archivos uno por uno es tedioso. Esta herramienta muestra cada imagen como una miniatura, te deja arrastrarlas al orden que prefieras y renombra cada una para que coincida, todo a la vez.',
      'El patrón de nombres es una plantilla sencilla: escribe {n} donde quieras que aparezca el número de secuencia, o {n:03} para rellenarlo con ceros hasta una cantidad fija de cifras (001, 002, ...). El resto de la plantilla se copia tal cual la escribas. La extensión original del archivo se mantiene siempre exactamente igual; solo cambia el nombre base.',
    ],
  },

  privacy: {
    h2: 'Por qué tus fotos no salen de tu dispositivo',
    lead: 'Aquí la privacidad es estructural, no una promesa. No hay un paso de subida porque no hay ningún servidor al que subir nada:',
    points: [
      'Las miniaturas y el renombrado se ejecutan por completo en tu navegador.',
      'La página se sirve como archivos estáticos y no envía ninguna petición con los datos de tus imágenes.',
      'El código es abierto y cualquiera puede leerlo (MIT).',
      'Funciona sin conexión, algo que solo es posible porque nada sale del dispositivo.',
    ],
    note: 'Si quieres comprobarlo tú mismo, abre el panel de Red de tu navegador mientras renombras: ninguna petición lleva tus archivos.',
    sourceLinkText: 'Leer el código fuente.',
  },

  howto: {
    h2: 'Cómo se usa',
    steps: [
      {
        h3: 'Añade tus imágenes',
        p: 'Haz clic para elegir archivos, o suéltalos en cualquier parte de la página. Puedes añadir varios a la vez.',
      },
      {
        h3: 'Arrastra para reordenar',
        p: 'Arrastra una miniatura para moverla, o usa los botones de subir/bajar. El número en cada miniatura muestra su posición actual.',
      },
      {
        h3: 'Define el patrón de nombres',
        p: 'Escribe una plantilla con {n} donde quieras el número de secuencia (por ejemplo, IMG_{n:04}), o elige uno de los patrones sugeridos. Una vista previa muestra cada nombre nuevo mientras escribes.',
      },
      {
        h3: 'Descarga el .zip',
        p: 'Cada archivo se renombra según su posición y se empaqueta en un único .zip; las extensiones nunca cambian.',
      },
    ],
  },

  faqHeading: 'Preguntas frecuentes',
  faq: [
    {
      q: '¿Se suben mis fotos a algún sitio?',
      a: 'No. Reordenar, renombrar y empaquetar en un .zip se ejecuta por completo en tu navegador. No hay ningún componente de servidor, así que tus archivos no tienen forma de salir del dispositivo. El código es abierto y puedes confirmarlo en el panel de Red de tu navegador.',
    },
    {
      q: '¿Cambia la extensión del archivo?',
      a: 'No. El patrón de nombres solo controla el nombre base (la parte antes del último punto). Sea .jpg, .JPG, .png o .webp, la extensión se mantiene exactamente igual.',
    },
    {
      q: '¿Cómo funciona el patrón de nombres?',
      a: 'Escribe {n} donde quieras que aparezca el número de secuencia, o {n:03} para rellenarlo con ceros hasta un ancho fijo (así 1, 2, 3 se convierten en 001, 002, 003). Todo lo demás que escribas —letras, guiones, guiones bajos— se copia tal cual. Por ejemplo, photo-{n:03} genera photo-001, photo-002, photo-003, y así sucesivamente.',
    },
    {
      q: '¿Qué pasa si dos archivos terminan con el mismo nombre?',
      a: 'La herramienta comprueba todos los nombres previstos antes de dejarte descargar, y muestra un mensaje claro si dos coincidirían (por ejemplo, una plantilla sin {n} le daría el mismo nombre a todos los archivos). Al ajustar la plantilla o la cantidad de archivos, la comprobación se supera automáticamente.',
    },
    {
      q: '¿Se editan o se vuelven a codificar las imágenes?',
      a: 'No. Los bytes de la imagen no se tocan en ningún momento; solo cambia el nombre del archivo. La calidad, los metadatos y el tamaño del archivo se mantienen exactamente igual.',
    },
    {
      q: '¿Funciona sin conexión?',
      a: 'Sí. Es una PWA. Tras la primera visita queda guardada en la caché, de modo que funciona sin conexión a la red. También puedes instalarla en tu pantalla de inicio.',
    },
  ],

  footer: {
    openSourceLabel: 'Código abierto (MIT)',
    partOf: 'parte de',
    brandTail: '— pequeñas herramientas que funcionan localmente en tu dispositivo.',
    colophon:
      'Creado y mantenido por Geppetto. Parte del código se escribe con ayuda de IA; la revisión y las decisiones son del responsable del proyecto.',
    securityText: 'Seguridad',
  },
};
