/**
 * ORIGEN · Vista «Portafolio y reglas»
 * ---------------------------------------------------------------------------
 * Las condiciones que el motor aplica antes de proponer cualquier resolución.
 * Publicar las reglas es parte de la explicabilidad: el analista puede
 * comprobar que la recomendación que ve respeta lo que aquí está escrito.
 *
 * Los topes se leen del catálogo, no se reescriben aquí: si alguien recalibra
 * un momento de vida, esta tabla lo refleja sin tocarla.
 *
 * Dependencias: core/namespace.js, core/{format,catalog}.js
 */
(function (ORIGEN) {
  "use strict";

  const { percent } = ORIGEN.core.format;
  const { LIFE_STAGES, PORTFOLIO_RULES } = ORIGEN.core.catalog;

  /**
   * Pinta la vista de portafolio.
   * @param {HTMLElement} container
   */
  function render(container) {
    const productRows = PORTFOLIO_RULES.map(function (rule) {
      return (
        "<tr>" +
        '<td class="cell-name">' + rule[0] + "</td>" +
        '<td style="color:var(--text-muted)">' + rule[1] + "</td>" +
        '<td style="color:var(--text-muted)">' + rule[2] + "</td>" +
        "</tr>"
      );
    }).join("");

    const stageRows = Object.keys(LIFE_STAGES)
      .map(function (key) {
        const stage = LIFE_STAGES[key];
        return (
          "<tr>" +
          '<td class="cell-name">' + stage.name + "</td>" +
          '<td class="is-right num">' + percent(stage.maxInstallmentRatio, 0) + "%</td>" +
          '<td class="is-right num">' + stage.maxTermMonths + " m</td>" +
          "</tr>"
        );
      })
      .join("");

    container.innerHTML =
      '<div class="phead"><div><h1>Portafolio y reglas</h1>' +
      '<div class="phead__sub">Las condiciones que el motor aplica antes de proponer ' +
      "cualquier resolución.</div></div></div>" +

      '<div class="card"><div class="card__head"><h3>Reglas de viabilidad</h3>' +
      '<span class="card__hint">Aplicadas en toda deliberación</span></div>' +
      '<div class="card__body">' +
      drow("Vinculación", "Superior a 2 meses", "6 meses si el contrato no es a término indefinido.") +
      drow("Capacidad", "1 SMMLV → libranza hasta $1.500.000",
        "$10.000.000 de ingreso → hasta 3× en libranza, no libranza o cupo.") +
      drow("Modalidad", "Ley 1527 de 2012", "Facultativos e independientes quedan fuera de libranza.") +
      drow("Sobreendeudamiento", "Tope por momento de vida",
        "Entre 22% y 32% del ingreso según la etapa detectada.") +
      "</div></div>" +

      '<div class="card"><div class="card__head"><h3>Líneas del portafolio</h3>' +
      '<span class="card__hint">7 productos</span></div>' +
      '<div class="card__body card__body--flush">' +
      "<table><thead><tr><th>Línea</th><th>Señal dominante</th><th>Condiciones</th></tr></thead>" +
      "<tbody>" + productRows + "</tbody></table>" +
      "</div></div>" +

      '<div class="card"><div class="card__head"><h3>Momentos de vida</h3>' +
      '<span class="card__hint">Cuota y plazo prudentes</span></div>' +
      '<div class="card__body card__body--flush">' +
      "<table><thead><tr><th>Momento</th>" +
      '<th class="is-right">Cuota tolerable</th><th class="is-right">Plazo máximo</th></tr></thead>' +
      "<tbody>" + stageRows + "</tbody></table>" +
      "</div></div>";
  }

  /** Fila de definición con clave, valor y nota. */
  function drow(key, value, note) {
    return (
      '<div class="drow"><div class="drow__key">' + key + "</div>" +
      '<div><div class="drow__value">' + value + "</div>" +
      '<div class="drow__note">' + note + "</div></div></div>"
    );
  }

  ORIGEN.ui.views = ORIGEN.ui.views || {};
  ORIGEN.ui.views.portfolio = { render };
})(window.ORIGEN);
