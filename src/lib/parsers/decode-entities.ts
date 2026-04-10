/**
 * Décodeur d'entités HTML pour les recettes importées
 *
 * Beaucoup de sites encodent incorrectement leur JSON-LD avec des entités HTML
 * (ex: `&#39;` au lieu de `'`, `&rsquo;` au lieu de `'`, `&eacute;` au lieu de `é`).
 * Ce helper décode ces séquences pour restituer le texte propre.
 *
 * Couvre :
 * - Entités numériques décimales : &#39;
 * - Entités numériques hexadécimales : &#x27;
 * - Entités nommées courantes (accents français, typographie, symboles)
 */

// Table des entités nommées les plus courantes dans les recettes françaises
const NAMED_ENTITIES: Record<string, string> = {
  // Typographie
  rsquo: '\u2019', lsquo: '\u2018', // apostrophes courbes
  rdquo: '\u201D', ldquo: '\u201C', // guillemets courbes
  quot: '"', apos: "'",
  laquo: '«', raquo: '»',
  hellip: '…', mdash: '—', ndash: '–',
  bull: '•', middot: '·', deg: '°',
  nbsp: ' ', thinsp: ' ', ensp: ' ', emsp: ' ',
  // Structure HTML
  lt: '<', gt: '>',
  // Symboles
  reg: '®', copy: '©', trade: '™',
  // Voyelles accentuées minuscules
  aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å', aelig: 'æ',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï',
  oacute: 'ó', ograve: 'ò', ocirc: 'ô', otilde: 'õ', ouml: 'ö', oslash: 'ø', oelig: 'œ',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü',
  yacute: 'ý', yuml: 'ÿ',
  ccedil: 'ç', ntilde: 'ñ',
  // Voyelles accentuées majuscules
  Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Atilde: 'Ã', Auml: 'Ä', Aring: 'Å', AElig: 'Æ',
  Eacute: 'É', Egrave: 'È', Ecirc: 'Ê', Euml: 'Ë',
  Iacute: 'Í', Igrave: 'Ì', Icirc: 'Î', Iuml: 'Ï',
  Oacute: 'Ó', Ograve: 'Ò', Ocirc: 'Ô', Otilde: 'Õ', Ouml: 'Ö', Oslash: 'Ø', OElig: 'Œ',
  Uacute: 'Ú', Ugrave: 'Ù', Ucirc: 'Û', Uuml: 'Ü',
  Yacute: 'Ý',
  Ccedil: 'Ç', Ntilde: 'Ñ',
}

/**
 * Décode les entités HTML d'une chaîne.
 * Retourne la chaîne inchangée si elle est vide ou ne contient pas d'entités.
 *
 * Ordre d'exécution :
 * 1. Entités numériques hexadécimales (&#x27;)
 * 2. Entités numériques décimales (&#39;)
 * 3. Entités nommées (sauf &amp;)
 * 4. &amp; en dernier pour éviter les doubles décodages
 */
export function decodeHtmlEntities(str: string): string {
  if (!str || !str.includes('&')) return str

  return str
    // Hexadécimales : &#x27;
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      const code = parseInt(hex, 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _m
    })
    // Décimales : &#39;
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = parseInt(dec, 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _m
    })
    // Nommées (hors &amp;)
    .replace(/&([a-zA-Z]+);/g, (_m, name) => {
      if (name === 'amp') return _m // traité en dernier
      return NAMED_ENTITIES[name] ?? _m
    })
    // &amp; en dernier
    .replace(/&amp;/g, '&')
}
