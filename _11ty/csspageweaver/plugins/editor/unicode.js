/**
 * Caractères Unicode pour la typographie
 * @see https://unicode.org/charts/
 */
export const UNICODE_CHARS = {
  // ========================
  // ESPACES SPÉCIAUX
  // ========================

  NO_BREAK_THIN_SPACE: "\u202F", /** Espace fine insécable (U+202F) - Utilisée avant ; ! ? en français */
  NO_BREAK_SPACE: "\u00A0", /** Espace insécable (U+00A0) - Utilisée avant : en français */

  // ========================
  // GUILLEMETS ET APOSTROPHES
  // ========================

  LDQUO: "\u201C", /** Guillemet ouvrant anglais (U+201C) " */
  RDQUO: "\u201D", /** Guillemet fermant anglais (U+201D) " */

  LAQUO: "«", /** Guillemet français ouvrant (U+00AB) */
  RAQUO: "»", /** Guillemet français fermant (U+00BB) */
};