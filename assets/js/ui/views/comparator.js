/**
 * ORIGEN · Vista «Comparador de perfiles»
 * ---------------------------------------------------------------------------
 * Dos cédulas, lado a lado, con las diferencias resaltadas.
 *
 * Responde de un vistazo al criterio no negociable del reto —«afiliados
 * distintos deben recibir ofertas distintas»— sin pedirle al jurado que se
 * fíe: cuenta cuántos atributos difieren y marca cada uno.
 *
 * Dependencias: core/namespace.js, core/format.js, domain/advanced/*,
 *               ui/{dom,toast}.js
 */
(function (ORIGEN) {
  "use strict";

  const { escapeHtml, money } = ORIGEN.core.format;
  const advanced = ORIGEN.domain.advanced;

  /** Cédulas por defecto: dos perfiles que sabemos que divergen. */
  const DEFAULT_A = "10000053";
  const DEFAULT_B = "10000325";

  function render(container) {
    container.innerHTML =
      '<div class="phead"><div><h1>Comparador de perfiles</h1>' +
      '<div class="phead__sub">Comprueba que el motor hace ofertas distintas a ' +
      "personas distintas.</div></div></div>" +

      '<div class="card"><div class="card__body querybar">' +
      '<div class="querybar__field">' +
      '<label class="querybar__label" for="cmp-a">Cédula A</label>' +
      '<input class="querybar__input" id="cmp-a" type="text" inputmode="numeric" value="' + DEFAULT_A + '">' +
      "</div>" +
      '<div class="querybar__field">' +
      '<label class="querybar__label" for="cmp-b">Cédula B</label>' +
      '<input class="querybar__input" id="cmp-b" type="text" inputmode="numeric" value="' + DEFAULT_B + '">' +
      "</div>" +
      '<button class="btn btn--primary" type="button" data-cmp="run">Comparar</button>' +
      "</div></div>" +

      '<div id="cmp-output"></div>';

    compare();
  }

  /** Filas comparables entre dos decisiones. */
  function buildRows(a, b) {
    function debt(profile) {
      return profile.obligations
        ? profile.obligations + " obl. · " + money(profile.externalBalance)
        : "sin deuda externa";
    }

    function slot(decision) {
      const parts = decision.delivery.moment.split("·");
      return decision.delivery.channel + " · " + parts[parts.length - 1].trim();
    }

    return [
      ["Perfil",
        a.profile.age + " años · " + a.profile.affiliationYears + " años afil.",
        b.profile.age + " años · " + b.profile.affiliationYears + " años afil."],
      ["Ingreso", money(a.profile.income), money(b.profile.income)],
      ["Deuda externa", debt(a.profile), debt(b.profile)],
      ["Etapa de vida", a.stage.stage, b.stage.stage],
      ["Señal dominante",
        a.signals[0].name + " (" + a.signals[0].weight + "%)",
        b.signals[0].name + " (" + b.signals[0].weight + "%)"],
      ["Viabilidad", a.eligibility.status, b.eligibility.status],
      ["Producto", a.best.product, b.best.product],
      ["Canal y momento", slot(a), slot(b)],
      ["Índice DCI", a.confidence.toFixed(2), b.confidence.toFixed(2)],
    ];
  }

  /** Ejecuta la comparación. */
  function compare() {
    const inputA = ORIGEN.ui.dom.byId("cmp-a");
    const inputB = ORIGEN.ui.dom.byId("cmp-b");
    if (!inputA || !inputB) return;

    const idA = inputA.value.replace(/\D/g, "");
    const idB = inputB.value.replace(/\D/g, "");

    if (idA.length < 6 || idB.length < 6) {
      ORIGEN.ui.toast.show("Cédulas inválidas", "Ambas deben tener al menos 6 dígitos.", true);
      return;
    }

    const a = advanced.decide(idA, null, advanced.sources.allEnabled());
    const b = advanced.decide(idB, null, advanced.sources.allEnabled());

    const rows = buildRows(a, b);
    const differing = rows.filter(function (row) {
      return row[1] !== row[2];
    }).length;

    const sameProduct = a.best.product === b.best.product;
    const sameChannel = a.delivery.channel === b.delivery.channel;

    ORIGEN.ui.dom.byId("cmp-output").innerHTML =
      '<div class="kpis">' +
      '<div class="kpi"><div class="kpi__label">Atributos distintos</div>' +
      '<div class="kpi__value">' + differing + "/" + rows.length + "</div></div>" +
      '<div class="kpi' + (sameProduct ? "" : " kpi--accent") + '">' +
      '<div class="kpi__label">Producto asignado</div>' +
      '<div class="kpi__value">' + (sameProduct ? "Igual" : "Distinto") + "</div></div>" +
      '<div class="kpi' + (sameChannel ? "" : " kpi--ok") + '">' +
      '<div class="kpi__label">Canal de entrega</div>' +
      '<div class="kpi__value">' + (sameChannel ? "Igual" : "Distinto") + "</div></div>" +
      "</div>" +

      '<div class="tablewrap"><table><thead><tr>' +
      "<th>Atributo</th>" +
      "<th>Afiliado A (" + escapeHtml(idA) + ")</th>" +
      "<th>Afiliado B (" + escapeHtml(idB) + ")</th>" +
      "</tr></thead><tbody>" +
      rows.map(function (row) {
        const differs = row[1] !== row[2];
        const cell = differs ? ' class="cmp-diff"' : "";
        return (
          '<tr><td class="cell-name">' + escapeHtml(row[0]) + "</td>" +
          "<td" + cell + ">" + escapeHtml(row[1]) + "</td>" +
          "<td" + cell + ">" + escapeHtml(row[2]) + "</td></tr>"
        );
      }).join("") +
      "</tbody></table></div>";
  }

  ORIGEN.ui.views = ORIGEN.ui.views || {};
  ORIGEN.ui.views.comparator = { render, compare };
})(window.ORIGEN);
