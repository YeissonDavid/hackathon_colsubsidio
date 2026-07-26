/**
 * ORIGEN · Bloques de la ficha de decisión
 * ---------------------------------------------------------------------------
 * Las dos piezas que sostienen la explicabilidad ante el jurado y ante una
 * auditoría:
 *
 *   capacityBlock      — a dónde va el ingreso antes y después de la resolución,
 *                        y qué reglas de política se comprobaron
 *   deliberationBlock  — el ranking completo de los 7 productos con la
 *                        descomposición del puntaje del ganador
 *
 * Dependencias: core/namespace.js, core/{format,catalog}.js
 */
(function (ORIGEN) {
  "use strict";

  const { money, percent } = ORIGEN.core.format;
  const { LIFE_STAGES, PRODUCTS, SIGNAL_COLORS, SIGNAL_COLOR_FALLBACK } = ORIGEN.core.catalog;

  /** Color de una señal, con reserva si la señal no está catalogada. */
  function signalColor(signal) {
    return SIGNAL_COLORS[signal] || SIGNAL_COLOR_FALLBACK;
  }

  /**
   * Barra de asignación del ingreso mensual.
   * @param {Array<{modifier: string, value: number, title: string}>} segments
   * @param {number} income Ingreso mensual, base del 100 %.
   */
  function allocationBar(segments, income) {
    const inner = segments
      .map(function (segment) {
        const width = Math.max(0, (segment.value / income) * 100).toFixed(1);
        return (
          '<i class="allocbar__seg allocbar__seg--' + segment.modifier +
          '" style="width:' + width + '%" title="' + segment.title + '"></i>'
        );
      })
      .join("");

    return '<div class="allocbar">' + inner + "</div>";
  }

  /**
   * Capacidad de pago y cumplimiento de política.
   *
   * La comparación «hoy» contra «con la resolución» es la que demuestra que la
   * cuota propuesta cabe. En compra de cartera se ve además que la resolución
   * SUSTITUYE la deuda externa en lugar de sumarse a ella.
   *
   * @param {object} d Registro de decisión.
   * @returns {string} HTML.
   */
  function capacityBlock(d) {
    const a = d.affiliate;
    const income = a.income;
    const stage = LIFE_STAGES[a.lifeStage];

    const isRoute = d.verdict === "no_viable";
    const installment = isRoute ? 0 : d.installment;

    // Obligaciones que siguen vivas tras la resolución.
    const remainingObligations = d.substitutes
      ? Math.max(0, d.committed - d.externalPayment)
      : d.committed;

    const freeToday = Math.max(0, income - d.committed);
    const freeAfter = Math.max(0, income - remainingObligations - installment);

    const todayBar = allocationBar(
      [
        d.substitutes
          ? { modifier: "external", value: d.externalPayment, title: "Deuda externa costosa" }
          : null,
        {
          modifier: "obligation",
          value: d.substitutes ? d.committed - d.externalPayment : d.committed,
          title: "Obligaciones",
        },
        { modifier: "free", value: freeToday, title: "Disponible" },
      ].filter(Boolean),
      income
    );

    const afterBar = isRoute
      ? ""
      : allocationBar(
          [
            { modifier: "obligation", value: remainingObligations, title: "Obligaciones que continúan" },
            { modifier: "resolution", value: installment, title: "Cuota de la resolución" },
            { modifier: "free", value: freeAfter, title: "Disponible" },
          ],
          income
        );

    /** Entrada de leyenda con su muestra de color. */
    function legendItem(colorVar, label, value) {
      return (
        '<div class="alegend"><span class="alegend__swatch" style="background:' + colorVar + '"></span>' +
        label + " <strong>" + value + "</strong></div>"
      );
    }

    const legend =
      (d.substitutes
        ? legendItem(
            "var(--alloc-external-2)",
            "Deuda externa al " + a.externalDebt.annualRate + "%",
            money(d.externalPayment) + "/mes"
          )
        : "") +
      legendItem("var(--alloc-obligation-2)", "Obligaciones", money(remainingObligations)) +
      (isRoute ? "" : legendItem("var(--accent)", "Cuota de la resolución", money(installment))) +
      legendItem("var(--surface-3)", "Disponible", money(isRoute ? freeToday : freeAfter));

    const freedNote =
      d.substitutes && d.freedCashFlow > 0
        ? '<div class="liber">La resolución <strong>sustituye</strong> la obligación externa en ' +
          "lugar de sumarse a ella: libera <strong>" + money(d.freedCashFlow) +
          "</strong> de flujo mensual.</div>"
        : "";

    /** Verificación de una regla de política, con su marca de cumplimiento. */
    function check(passed, text) {
      return (
        '<div class="pcheck"><span class="pcheck__mark' + (passed ? "" : " pcheck__mark--fail") + '">' +
        (passed ? "✓" : "✕") + "</span>" + text + "</div>"
      );
    }

    const policy =
      '<div class="policy">' +
      check(
        !d.policy.exceedsLoad,
        "Carga final <strong>" + percent(d.finalLoad) + "%</strong> · tope del momento de vida " +
          percent(stage.maxInstallmentRatio, 0) + "%"
      ) +
      check(
        !d.policy.insufficientTenure,
        "Vinculación <strong>" + a.tenureMonths + " meses</strong> · mínimo " + d.minTenure
      ) +
      check(true, "Modalidad <strong>" + d.modality + "</strong> · Ley 1527 de 2012") +
      check(true, "Tope por capacidad <strong>" + money(d.libranzaCap) + "</strong>") +
      "</div>";

    return (
      '<div class="alloc">' +
      '<div class="allocrow"><span class="allocrow__label">Hoy</span>' + todayBar + "</div>" +
      (isRoute
        ? ""
        : '<div class="allocrow"><span class="allocrow__label allocrow__label--active">' +
          "Con la resolución</span>" + afterBar + "</div>") +
      '<div class="alloclegend">' + legend + "</div>" +
      freedNote +
      policy +
      "</div>"
    );
  }

  /**
   * Deliberación del portafolio.
   *
   * Muestra los siete productos, no solo el ganador: ver por cuánto y por qué
   * ganó —y qué quedó segundo— es lo que convierte una recomendación en una
   * decisión auditable.
   *
   * @param {object} d Registro de decisión.
   * @returns {string} HTML.
   */
  function deliberationBlock(d) {
    // Todas las barras se escalan contra el puntaje del líder.
    const max = Math.max(1, d.ranking[0].sum);

    const rows = d.ranking
      .map(function (entry, position) {
        const isWinner = position === 0;

        const segments = entry.parts
          .map(function (part) {
            const width = ((part.points / max) * 100).toFixed(1);
            return (
              '<i class="dltrack__seg" data-width="' + width + '%"' +
              ' style="background:' + signalColor(part.signal) +
              ";opacity:" + (isWinner ? 1 : 0.5) + '"' +
              ' title="' + part.signal + ": +" + part.points + '"></i>'
            );
          })
          .join("");

        return (
          '<div class="dlrow' + (isWinner ? " dlrow--winner" : "") + '">' +
          '<div class="dlrow__name">' + PRODUCTS[entry.product].name + "</div>" +
          '<div class="dltrack">' + segments + "</div>" +
          '<div class="dlrow__score">' + entry.sum + "</div>" +
          "</div>"
        );
      })
      .join("");

    const winner = d.ranking[0];

    const contributions = winner.parts
      .map(function (part) {
        return (
          '<div class="crow">' +
          '<span class="crow__swatch" style="background:' + signalColor(part.signal) + '"></span>' +
          '<span class="crow__label">' + part.signal + "</span>" +
          '<span class="crow__value">+' + part.points + "</span>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="delib">' + rows + "</div>" +
      '<div class="contrib">' +
      '<div class="contrib__head">Composición del puntaje · ' + PRODUCTS[winner.product].name + "</div>" +
      contributions +
      '<div class="crow crow--total">' +
      '<span class="crow__label">Puntaje de ajuste al perfil</span>' +
      '<span class="crow__value">' + winner.sum + "</span>" +
      "</div>" +
      "</div>"
    );
  }

  ORIGEN.ui.blocks = { capacityBlock, deliberationBlock, signalColor };
})(window.ORIGEN);
