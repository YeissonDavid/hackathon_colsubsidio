/**
 * ORIGEN · Utilidades de DOM
 * ---------------------------------------------------------------------------
 * Capa mínima sobre el DOM nativo. No es un framework: solo evita repetir
 * `document.getElementById` y centraliza el patrón de delegación de eventos.
 *
 * Regla del proyecto: NINGÚN manejador de eventos se escribe como atributo
 * HTML (`onclick=`, `onchange=`). Todos se registran desde JavaScript. Los
 * atributos inline obligan a que las funciones sean globales, impiden
 * endurecer la política de seguridad de contenido (CSP sin `unsafe-inline`) y
 * mezclan comportamiento con estructura.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  /** Elemento por id. */
  function byId(id) {
    return document.getElementById(id);
  }

  /** Primer elemento que coincide, dentro de `root` o del documento. */
  function one(selector, root) {
    return (root || document).querySelector(selector);
  }

  /** Todos los elementos que coinciden, como arreglo real. */
  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  /**
   * Delegación de eventos: un solo escucha en el contenedor atiende a todos
   * los descendientes que coincidan con el selector, incluidos los que se
   * creen después. Es lo que permite volver a pintar una vista completa sin
   * tener que reasignar manejadores uno por uno.
   *
   * @param {Element} root Contenedor estable.
   * @param {string} type Tipo de evento.
   * @param {string} selector Selector de los descendientes que responden.
   * @param {(event: Event, target: Element) => void} handler
   */
  function delegate(root, type, selector, handler) {
    root.addEventListener(type, function (event) {
      const target = event.target.closest(selector);
      if (target && root.contains(target)) handler(event, target);
    });
  }

  /**
   * Reinicia una transición de ancho para que se vea crecer desde cero.
   *
   * El doble `requestAnimationFrame` es necesario: el navegador debe registrar
   * el ancho inicial en un fotograma antes de aplicar el final, o la
   * transición no se dispara.
   *
   * @param {Element[]} elements Elementos con el ancho objetivo en data-width.
   */
  function animateWidths(elements) {
    elements.forEach(function (element) {
      const target = element.dataset.width;
      if (target === undefined) return;
      element.style.width = "0";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          element.style.width = target;
        });
      });
    });
  }

  ORIGEN.ui.dom = { byId, one, all, delegate, animateWidths };
})(window.ORIGEN);
