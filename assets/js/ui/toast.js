/**
 * ORIGEN · Aviso emergente
 * ---------------------------------------------------------------------------
 * Confirmación breve de una acción del analista. El contenedor lleva
 * `role="status"` y `aria-live="polite"` en el markup, de modo que un lector
 * de pantalla anuncia el aviso sin robar el foco al usuario.
 *
 * Se escribe con `textContent`, nunca con `innerHTML`: el texto puede incluir
 * el nombre de un producto o un monto formateado y no hay razón para permitir
 * marcado en un aviso.
 *
 * Dependencias: core/namespace.js, ui/dom.js
 */
(function (ORIGEN) {
  "use strict";

  const { byId } = ORIGEN.ui.dom;

  /** Milisegundos que permanece visible. */
  const VISIBLE_MS = 3400;

  let hideTimer = null;

  /**
   * Muestra un aviso.
   *
   * @param {string} title Qué ocurrió.
   * @param {string} detail Consecuencia concreta para el afiliado o el proceso.
   * @param {boolean} [isRisk] true para los avisos de protección o negativa.
   */
  function show(title, detail, isRisk) {
    const element = byId("toast");
    if (!element) return;

    byId("toast-title").textContent = title;
    byId("toast-detail").textContent = detail;

    element.classList.toggle("toast--risk", Boolean(isRisk));
    element.classList.add("is-visible");

    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      element.classList.remove("is-visible");
    }, VISIBLE_MS);
  }

  ORIGEN.ui.toast = { show };
})(window.ORIGEN);
