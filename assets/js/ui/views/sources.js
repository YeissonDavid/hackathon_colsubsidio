/**
 * ORIGEN · Vista «Fuentes y consentimiento»
 * ---------------------------------------------------------------------------
 * Gobierno del dato: cada variable que entra al motor declara su origen, su
 * base jurídica y su frecuencia de actualización.
 *
 * Esta pantalla es la respuesta a la pregunta de cumplimiento —«¿con qué
 * derecho usan este dato?»— y la evidencia de que la inferencia de carga
 * externa se hace sin consultar Datacrédito en tiempo real.
 *
 * Dependencias: core/namespace.js, core/catalog.js, domain/dataset.js
 */
(function (ORIGEN) {
  "use strict";

  const { DATA_SOURCES } = ORIGEN.core.catalog;

  /**
   * Pinta la vista de fuentes.
   * @param {HTMLElement} container
   */
  function render(container) {
    const total = ORIGEN.domain.dataset.all().length;

    const rows = DATA_SOURCES.map(function (source) {
      return (
        "<tr>" +
        '<td class="cell-name">' + source[0] + "</td>" +
        '<td style="color:var(--text-muted)">' + source[1] + "</td>" +
        '<td style="color:var(--text-muted)">' + source[2] + "</td>" +
        '<td class="is-right num" style="color:var(--text-faint)">' + source[3] + "</td>" +
        "</tr>"
      );
    }).join("");

    container.innerHTML =
      '<div class="phead"><div><h1>Fuentes y consentimiento</h1>' +
      '<div class="phead__sub">Cada variable que entra al motor declara su origen, su base ' +
      "jurídica y su frecuencia.</div></div>" +
      '<div class="phead__actions">' +
      '<button class="btn btn--sm" type="button" data-action="revocations">' +
      "Registro de revocaciones</button></div></div>" +

      '<div class="card"><div class="card__head"><h3>Inventario de fuentes</h3>' +
      '<span class="card__hint">Trazabilidad completa</span></div>' +
      '<div class="card__body card__body--flush">' +
      "<table><thead><tr><th>Fuente</th><th>Qué aporta</th><th>Base jurídica</th>" +
      '<th class="is-right">Actualización</th></tr></thead>' +
      "<tbody>" + rows + "</tbody></table>" +
      "</div></div>" +

      '<div class="card"><div class="card__head"><h3>Principio operativo</h3></div>' +
      '<div class="card__body">' +
      drow(
        "Reproducibilidad",
        "Toda resolución se puede reconstruir",
        "Se archivan las variables usadas, su valor en el momento de la decisión y el " +
          "puntaje de cada producto evaluado."
      ) +
      drow(
        "Revocación",
        "El afiliado puede retirar su consentimiento",
        "Las variables afectadas salen del motor y las resoluciones futuras se recalculan sin ellas."
      ) +
      drow(
        "Datos de esta demostración",
        "Población sintética calibrada",
        total + " afiliados generados con distribución real de categorías. Se reemplaza por los " +
          "feeds de Colsubsidio sin cambiar la arquitectura."
      ) +
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
  ORIGEN.ui.views.sources = { render };
})(window.ORIGEN);
