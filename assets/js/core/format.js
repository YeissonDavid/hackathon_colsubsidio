/**
 * ORIGEN · Formato y escape
 * ---------------------------------------------------------------------------
 * Presentación de valores y saneamiento de texto para inserción en HTML.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  /** Pesos colombianos sin decimales: `$1.250.000`. */
  function money(value) {
    return "$" + Math.round(value).toLocaleString("es-CO");
  }

  /** Pesos abreviados en miles: `$1.250k`. */
  function moneyShort(value) {
    return "$" + Math.round(value / 1000).toLocaleString("es-CO") + "k";
  }

  /** Porcentaje con `decimals` cifras: `32.4 %`. */
  function percent(ratio, decimals) {
    return (ratio * 100).toFixed(decimals === undefined ? 1 : decimals);
  }

  const HTML_ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  /**
   * Escapa texto para insertarlo en una plantilla HTML.
   *
   * Regla del proyecto: TODO valor que provenga de datos —nombre, correo,
   * cédula, tipo de contrato— pasa por aquí antes de concatenarse en HTML.
   * Hoy la población es sintética, pero cuando se conecten los feeds reales de
   * Colsubsidio los nombres serán entrada externa y esto es lo único que
   * separa la interfaz de una inyección de HTML.
   *
   * @param {unknown} value
   * @returns {string}
   */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return HTML_ENTITIES[char];
    });
  }

  /**
   * Iniciales de un nombre, tolerante a nombres de una sola palabra.
   * (La versión anterior asumía siempre dos palabras y lanzaba TypeError con
   * un nombre simple.)
   *
   * @param {string} fullName
   * @returns {string} Una o dos letras en mayúscula.
   */
  function initials(fullName) {
    const words = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "—";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  /** Plazo legible: meses hasta 60, años a partir de ahí. */
  function term(months) {
    return months > 60 ? Math.round(months / 12) + " años" : months + " meses";
  }

  ORIGEN.core.format = {
    money,
    moneyShort,
    percent,
    escapeHtml,
    initials,
    term,
  };
})(window.ORIGEN);
