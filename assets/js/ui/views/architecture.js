/**
 * ORIGEN · Vista «Arquitectura»
 * ---------------------------------------------------------------------------
 * El diagrama de la arquitectura AS-IS, dentro de la propia aplicación.
 *
 * Tenerlo aquí y no solo en un PDF permite responder «¿cómo está construido?»
 * sin salir de la demo.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  /** Repositorio público del proyecto. */
  const REPOSITORY = "https://github.com/YeissonDavid/hackathon_colsubsidio";

  /** Icono de GitHub. */
  const GITHUB_ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577' +
    'v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729' +
    '.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305' +
    '.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524' +
    '.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404' +
    '2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0' +
    '4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589' +
    '8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>';

  function render(container) {
    container.innerHTML =
      '<div class="phead"><div><h1>Arquitectura de la solución</h1>' +
      '<div class="phead__sub">Arquitectura técnica de la fase AS-IS, la que corre en esta ' +
      "demostración.</div></div>" +
      '<div class="phead__actions">' +
      '<a class="btn btn--sm" href="' + REPOSITORY + '" target="_blank" rel="noopener noreferrer">' +
      GITHUB_ICON + " Ver repositorio</a>" +
      "</div></div>" +

      '<div class="card"><div class="card__body">' +
      '<img class="archdiagram" src="assets/img/arq.jpeg"' +
      ' alt="Diagrama de la arquitectura AS-IS de ORIGEN" loading="lazy">' +
      "</div></div>" +

      '<div class="card"><div class="card__head"><h3>Cómo está organizado el código</h3>' +
      '<span class="card__hint">Resumen</span></div>' +
      '<div class="card__body">' +
      drow("Capas", "core → domain → ui",
        "Las dependencias apuntan siempre hacia abajo. El dominio no conoce el DOM: se " +
        "ejecuta igual en el navegador y en consola, y de hecho las pruebas lo hacen así.") +
      drow("Dos motores", "Base y avanzado",
        "El motor base sirve la bandeja y el lote sobre una población sembrada. El avanzado " +
        "resuelve una cédula cualquiera derivando su perfil por hash, con las fuentes " +
        "exógenas conmutables.") +
      drow("Sin dependencias", "HTML, CSS y JavaScript nativos",
        "Ni bundler ni librerías, incluidos los gráficos. Arranca con doble clic y no hay " +
        "ningún CDN que pueda fallar durante la demostración.") +
      drow("Comprobable", "Pruebas sin instalación",
        "La suite se ejecuta abriendo tests/index.html, o con node tests/run-node.js.") +
      "</div></div>";
  }

  function drow(key, value, note) {
    return (
      '<div class="drow"><div class="drow__key">' + key + "</div>" +
      '<div><div class="drow__value">' + value + "</div>" +
      '<div class="drow__note">' + note + "</div></div></div>"
    );
  }

  ORIGEN.ui.views = ORIGEN.ui.views || {};
  ORIGEN.ui.views.architecture = { render };
})(window.ORIGEN);
