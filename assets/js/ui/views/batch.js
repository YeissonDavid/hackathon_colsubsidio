/**
 * ORIGEN · Vista «Procesamiento por lote»
 * ---------------------------------------------------------------------------
 * Cómo se comporta el motor sobre una base completa, no sobre un caso. Es la
 * pantalla que demuestra que la solución escala más allá de la anécdota.
 *
 * La barra de progreso simula el recorrido de un lote real: las decisiones ya
 * están calculadas, lo que se anima es el avance. Está declarado como tal en la
 * interfaz («Demostración» en la barra superior) para no dar a entender que hay
 * un backend procesando.
 *
 * Dependencias: core/namespace.js, core/catalog.js, domain/dataset.js,
 *               ui/{dom,toast}.js
 */
(function (ORIGEN) {
  "use strict";

  const { LIFE_STAGES, PRODUCTS } = ORIGEN.core.catalog;
  const { money } = ORIGEN.core.format;

  /** Intervalo de refresco de la barra simulada, en milisegundos. */
  const TICK_MS = 180;

  /** Identificador del intervalo activo, para poder cancelarlo. */
  let runTimer = null;

  /**
   * Fila de distribución.
   * @param {string} label
   * @param {number} value Valor absoluto.
   * @param {number} scale Denominador de la barra (total o máximo de la serie).
   * @param {string} color Token CSS del relleno.
   * @param {number} total Denominador del porcentaje mostrado.
   */
  function distRow(label, value, scale, color, total, amount) {
    const width = ((value / scale) * 100).toFixed(1);
    const pct = ((value / total) * 100).toFixed(0);

    return (
      '<div class="distrow">' +
      '<div class="distrow__label">' + label + "</div>" +
      '<div class="distrow__track">' +
      '<i class="distrow__fill" data-width="' + width + '%" style="background:' + color + '"></i>' +
      "</div>" +
      '<div class="distrow__value">' + value + ' <span class="distrow__pct">' + pct + "%</span>" +
      (amount === undefined ? "" : '<br><span class="distrow__amount">' + amount + "</span>") +
      "</div></div>"
    );
  }

  /**
   * Pinta la vista de lote.
   * @param {HTMLElement} container
   */
  function render(container) {
    const dataset = ORIGEN.domain.dataset;
    const total = dataset.all().length;

    const byVerdict = dataset.groupCount(function (d) { return d.verdict; });

    // Monto colocable por determinación: convierte el reparto en cifra de negocio.
    const amountByVerdict = {};
    dataset.all().forEach(function (d) {
      amountByVerdict[d.verdict] = (amountByVerdict[d.verdict] || 0) + (d.amount || 0);
    });

    // El producto solo se cuenta sobre los viables: en una ruta de bienestar no
    // hay producto asignado y contarlo distorsionaría el reparto.
    const byProduct = dataset.groupCount(
      function (d) { return d.product; },
      function (d) { return d.verdict !== "no_viable"; }
    );

    const byCategory = dataset.groupCount(function (d) { return d.affiliate.category; });
    const byStage = dataset.groupCount(function (d) { return d.affiliate.lifeStage; });

    const maxProduct = Math.max.apply(null, Object.values(byProduct));
    const maxStage = Math.max.apply(null, Object.values(byStage));

    const productRows = Object.entries(byProduct)
      .sort(function (x, y) { return y[1] - x[1]; })
      .map(function (entry) {
        return distRow(PRODUCTS[entry[0]].name, entry[1], maxProduct, "var(--accent)", total);
      })
      .join("");

    const stageRows = Object.entries(byStage)
      .sort(function (x, y) { return y[1] - x[1]; })
      .map(function (entry) {
        return distRow(LIFE_STAGES[entry[0]].name, entry[1], maxStage, "var(--lifestage)", total);
      })
      .join("");

    const categoryRows = ["A", "B", "C"]
      .map(function (category) {
        return distRow("Categoría " + category, byCategory[category] || 0, total, "var(--info)", total);
      })
      .join("");

    container.innerHTML =
      '<div class="phead">' +
      "<div><h1>Procesamiento por lote</h1>" +
      '<div class="phead__sub">Enriquecimiento y deliberación sobre un archivo de cédulas.</div></div>' +
      '<div class="phead__actions">' +
      '<button class="btn btn--sm" type="button" data-action="load">Cargar archivo</button>' +
      '<button class="btn btn--primary btn--sm" type="button" data-action="run">Ejecutar lote</button>' +
      "</div></div>" +

      '<div class="runline">' +
      '<div class="runstat" id="run-status">Último lote · ' + total + " cédulas procesadas</div>" +
      '<div class="runbar"><i class="runbar__fill" id="run-bar" style="width:100%"></i></div>' +
      '<div class="runstat" id="run-pct">100%</div>' +
      "</div>" +

      '<div class="batchgrid">' +
      card("Determinación", "Distribución del lote",
        distRow("Viable", byVerdict.viable || 0, total, "var(--ok)", total,
          money(amountByVerdict.viable || 0)) +
        distRow("Con condiciones", byVerdict.viable_condiciones || 0, total, "var(--warn)", total,
          money(amountByVerdict.viable_condiciones || 0)) +
        distRow("Mejor momento", byVerdict.mejor_momento || 0, total, "var(--info)", total,
          money(amountByVerdict.mejor_momento || 0)) +
        distRow("Ruta de bienestar", byVerdict.no_viable || 0, total, "var(--risk)", total,
          "$0")) +
      card("Producto asignado", "Sobre los viables", productRows) +
      card("Momento de vida detectado", "Clasificador", stageRows) +
      card("Categoría de afiliación", "A ≤2 SMMLV · B 2–4 · C >4", categoryRows) +
      "</div>";

    ORIGEN.ui.dom.animateWidths(ORIGEN.ui.dom.all(".distrow__fill", container));
  }

  function card(title, hint, body) {
    return (
      '<div class="card"><div class="card__head"><h3>' + title + "</h3>" +
      '<span class="card__hint">' + hint + "</span></div>" +
      '<div class="card__body">' + body + "</div></div>"
    );
  }

  /**
   * Ejecuta la simulación de avance del lote.
   * Cancela cualquier ejecución previa para que dos clics seguidos no dejen
   * dos intervalos compitiendo por la misma barra.
   */
  function run() {
    const { byId } = ORIGEN.ui.dom;
    const bar = byId("run-bar");
    const pct = byId("run-pct");
    const status = byId("run-status");
    if (!bar) return;

    const total = ORIGEN.domain.dataset.all().length;
    let progress = 0;

    clearInterval(runTimer);
    bar.style.width = "0%";
    pct.textContent = "0%";
    status.textContent = "Enriqueciendo y deliberando…";

    runTimer = setInterval(function () {
      progress += Math.random() * 11 + 4;

      if (progress >= 100) {
        progress = 100;
        clearInterval(runTimer);
        runTimer = null;
        status.textContent = "Lote completo · " + total + " cédulas procesadas";
        ORIGEN.ui.toast.show(
          "Lote procesado",
          total + " afiliados enriquecidos, deliberados y con resolución sugerida."
        );
      }

      bar.style.width = progress + "%";
      pct.textContent = Math.round(progress) + "%";
    }, TICK_MS);
  }

  /** Detiene la simulación al salir de la vista. */
  function teardown() {
    clearInterval(runTimer);
    runTimer = null;
  }

  ORIGEN.ui.views = ORIGEN.ui.views || {};
  ORIGEN.ui.views.batch = { render, run, teardown };
})(window.ORIGEN);
