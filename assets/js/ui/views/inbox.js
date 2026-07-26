/**
 * ORIGEN · Vista «Bandeja de decisión»
 * ---------------------------------------------------------------------------
 * Pantalla de entrada: los afiliados ya enriquecidos y deliberados, con su
 * resolución sugerida, pendientes de que el analista actúe.
 *
 * Todo el texto que proviene de datos pasa por `escapeHtml`, y toda la PII por
 * el módulo de privacidad.
 *
 * Dependencias: core/namespace.js, core/{config,format,catalog}.js,
 *               domain/dataset.js, ui/{dom,privacy,toast}.js
 */
(function (ORIGEN) {
  "use strict";

  const { escapeHtml, money } = ORIGEN.core.format;
  const { LIFE_STAGES, PRODUCTS, VERDICTS } = ORIGEN.core.catalog;

  /** Filtros disponibles, en orden de presentación. */
  const FILTERS = [
    ["todos", "Todos"],
    ["viable", "Viables"],
    ["viable_condiciones", "Con condiciones"],
    ["mejor_momento", "Mejor momento"],
    ["no_viable", "Ruta de bienestar"],
  ];

  /** Filtro activo. Estado propio de la vista, no global. */
  let activeFilter = "todos";

  /** Recuento por veredicto, para los KPI y los contadores de filtro. */
  function counts() {
    const dataset = ORIGEN.domain.dataset;
    return {
      todos: dataset.all().length,
      viable: dataset.countBy(function (d) { return d.verdict === "viable"; }),
      viable_condiciones: dataset.countBy(function (d) { return d.verdict === "viable_condiciones"; }),
      mejor_momento: dataset.countBy(function (d) { return d.verdict === "mejor_momento"; }),
      no_viable: dataset.countBy(function (d) { return d.verdict === "no_viable"; }),
    };
  }

  /** Una fila de la tabla. */
  function row(d) {
    const a = d.affiliate;
    const verdict = VERDICTS[d.verdict];
    const resolved = ORIGEN.domain.dataset.resolutionOf(d.index);
    const isRoute = d.verdict === "no_viable";
    const confidencePct = Math.round(d.confidence * 100);

    return (
      '<tr data-index="' + d.index + '" tabindex="0">' +
      "<td>" +
      '<div class="cell-name">' + escapeHtml(ORIGEN.ui.privacy.maskName(a.name)) + "</div>" +
      '<div class="cell-sub">' + escapeHtml(ORIGEN.ui.privacy.maskId(a.id)) + "</div>" +
      "</td>" +
      '<td class="num">' + escapeHtml(a.category) + "</td>" +
      '<td><span class="tag-lifestage">' + LIFE_STAGES[a.lifeStage].name + "</span></td>" +
      "<td>" + (isRoute ? "—" : PRODUCTS[d.product].name) + "</td>" +
      '<td class="is-right num">' + (isRoute ? "—" : money(d.amount)) + "</td>" +
      '<td><span class="pill pill--' + verdict.modifier + '">' +
      (resolved ? "Resuelto · " : "") + verdict.label + "</span></td>" +
      '<td class="is-right"><div class="conf">' +
      '<div class="conf__track"><i class="conf__fill" style="width:' + confidencePct + '%"></i></div>' +
      '<span class="num">' + confidencePct + "%</span>" +
      "</div></td>" +
      "</tr>"
    );
  }

  /**
   * Pinta la bandeja.
   * @param {HTMLElement} container
   */
  function render(container) {
    const dataset = ORIGEN.domain.dataset;
    const all = dataset.all();
    const c = counts();

    const averageConfidence = Math.round(
      (all.reduce(function (sum, d) { return sum + d.confidence; }, 0) / all.length) * 100
    );

    const list = all.filter(function (d) {
      return activeFilter === "todos" ? true : d.verdict === activeFilter;
    });

    const pageSize = ORIGEN.config.INBOX_PAGE_SIZE;
    const rows = list.slice(0, pageSize).map(row).join("");

    const filterChips = FILTERS.map(function (filter) {
      const key = filter[0];
      return (
        '<button class="fchip" type="button" data-filter="' + key + '"' +
        ' aria-pressed="' + (activeFilter === key ? "true" : "false") + '">' +
        filter[1] + '<span class="fchip__count">' + c[key] + "</span>" +
        "</button>"
      );
    }).join("");

    container.innerHTML =
      '<div class="phead">' +
      "<div><h1>Bandeja de decisión</h1>" +
      '<div class="phead__sub">Afiliados enriquecidos y deliberados, pendientes de resolución.</div></div>' +
      '<div class="phead__actions">' +
      '<button class="btn btn--sm" type="button" data-action="export">Exportar</button>' +
      '<button class="btn btn--primary btn--sm" type="button" data-goto="lote">Procesar lote</button>' +
      "</div></div>" +

      '<div class="kpis">' +
      kpi("", "En bandeja", all.length, "enriquecidos hoy") +
      kpi("ok", "Viables", c.viable + c.viable_condiciones, c.viable_condiciones + " con condiciones") +
      kpi("accent", "Mejor momento", c.mejor_momento, "reprogramados") +
      kpi("risk", "Ruta de bienestar", c.no_viable, "protección activa") +
      kpi("", "Confianza media", averageConfidence + "%", "del motor") +
      "</div>" +

      '<div class="filters" role="group" aria-label="Filtrar por veredicto">' + filterChips + "</div>" +

      '<div class="tablewrap tablewrap--interactive">' +
      "<table><thead><tr>" +
      "<th>Afiliado</th><th>Cat.</th><th>Momento de vida</th><th>Decisión sugerida</th>" +
      '<th class="is-right">Monto</th><th>Estado</th><th class="is-right">Confianza</th>' +
      "</tr></thead>" +
      "<tbody>" + rows + "</tbody></table>" +
      '<div class="tfoot">' +
      "<span>Mostrando " + Math.min(pageSize, list.length) + " de " + list.length + "</span>" +
      "<span>Orden: prioridad del motor</span>" +
      "</div></div>";
  }

  /** Tarjeta de KPI. */
  function kpi(modifier, label, value, note) {
    return (
      '<div class="kpi' + (modifier ? " kpi--" + modifier : "") + '">' +
      '<div class="kpi__label">' + label + "</div>" +
      '<div class="kpi__value">' + value + "</div>" +
      '<div class="kpi__note">' + note + "</div>" +
      "</div>"
    );
  }

  /** Cambia el filtro activo y devuelve true si hay que repintar. */
  function setFilter(key) {
    if (activeFilter === key) return false;
    activeFilter = key;
    return true;
  }

  ORIGEN.ui.views = ORIGEN.ui.views || {};
  ORIGEN.ui.views.inbox = { render, setFilter };
})(window.ORIGEN);
