/**
 * ORIGEN · Narrativa de la decisión
 * ---------------------------------------------------------------------------
 * Traduce el resultado del motor a la frase que leerá el afiliado.
 *
 * Está separado de la decisión a propósito: `decision.js` produce datos y
 * `narrative.js` produce lenguaje. Así se puede cambiar el tono, traducir o
 * sustituir estas plantillas por un LLM sin tocar ni una regla de crédito — y,
 * al contrario, auditar la lógica sin leer copys.
 *
 * Cada frase explica una causa concreta, nunca un resultado genérico: es lo
 * que el reto pide cuando exige que el afiliado entienda el porqué.
 *
 * Dependencias: core/namespace.js, core/format.js, core/config.js
 */
(function (ORIGEN) {
  "use strict";

  const { money } = ORIGEN.core.format;

  /**
   * Redacta la razón de la resolución.
   *
   * @param {object} ctx
   * @param {object} ctx.affiliate
   * @param {string} ctx.product
   * @param {string} ctx.verdict
   * @param {boolean} ctx.isSequenced Consumo primero y luego otro producto.
   * @param {number} ctx.freedCashFlow Flujo mensual liberado, si sustituye deuda.
   * @returns {string}
   */
  function explainDecision(ctx) {
    const a = ctx.affiliate;
    const debt = a.externalDebt;

    // --- Ruta de bienestar: hay que explicar por qué NO se presta ---------
    if (ctx.verdict === "no_viable") {
      if (a.currentLoad > ORIGEN.config.SEVERE_LOAD) {
        return (
          "Su presupuesto ya está comprometido. En lugar de sumar una cuota, se propone " +
          "una ruta corta para liberar capacidad y recalificar en seis meses."
        );
      }
      return (
        "Aún no cumple el tiempo mínimo de vinculación para esta línea. " +
        "Se le notifica automáticamente al calificar."
      );
    }

    // --- Secuencia: ordenar la deuda antes del objetivo real -------------
    if (ctx.isSequenced) {
      return (
        "Paga " + debt.count + " obligaciones externas al " + debt.annualRate + "% E.A. " +
        "Sustituirlas libera " + money(ctx.freedCashFlow) + " al mes — capacidad suficiente " +
        "para su objetivo sin tensionar el hogar."
      );
    }

    // --- Razón por producto ----------------------------------------------
    if (ctx.product === "consumo") {
      return (
        "Se detectaron " + debt.count + " obligación(es) externa(s) al " + debt.annualRate +
        "% E.A. Sustituirlas por una sola cuota libera " + money(ctx.freedCashFlow) + " al mes."
      );
    }

    if (ctx.product === "mujeres") {
      const years = Math.max(1, Math.round(a.tenureMonths / 12));
      return (
        "Lleva cerca de " + years + " año(s) de afiliación y su momento de vida requiere " +
        "acompañar el hogar, con protección incluida."
      );
    }

    if (ctx.product === "vivienda") {
      return (
        "Su estabilidad y momento de vida permiten construir patrimonio con una cuota " +
        "sostenible en el largo plazo."
      );
    }

    if (ctx.product === "educativo") {
      return (
        "Se detecta una necesidad formativa en el hogar, financiable con plazos flexibles " +
        "antes de la matrícula."
      );
    }

    // --- Inclusión financiera: el caso del ingreso no bancarizado --------
    if (a.unbankedIncomeMonths > 0) {
      return (
        "Sus ingresos varían pero llegan con regularidad desde hace " + a.unbankedIncomeMonths +
        " meses. Se inicia con un cupo sostenible que crece con el cumplimiento."
      );
    }

    return (
      "Por su trayectoria y uso del ecosistema, esta línea es la que mejor acompaña su " +
      "día a día, ajustada a su capacidad real."
    );
  }

  /**
   * Lectura en lenguaje natural del gráfico de proyección: por qué el escenario
   * ganador es mejor y por cuánto.
   *
   * @param {object} ctx
   * @param {"now"|"wait"|"route"} ctx.winner
   * @param {number} ctx.margin Puntos de ventaja sobre la mejor alternativa.
   * @param {boolean} ctx.isSequenced
   * @returns {string} HTML con una única etiqueta <strong> de énfasis.
   */
  function explainProjection(ctx) {
    if (ctx.winner === "route") {
      return (
        "<strong>No otorgar y acompañar</strong> deja al afiliado " + ctx.margin +
        " puntos por encima de la mejor alternativa de crédito a doce meses. " +
        "Otorgar hoy elevaría su carga y su probabilidad de mora."
      );
    }

    if (ctx.winner === "wait") {
      return (
        "<strong>Esperar</strong> supera por " + ctx.margin + " puntos a otorgar hoy: " +
        "al cerrarse una obligación se libera capacidad y el mismo objetivo se alcanza " +
        "con una cuota más holgada."
      );
    }

    if (ctx.isSequenced) {
      return (
        "<strong>Otorgar ahora en secuencia</strong> — consumo primero — supera por " +
        ctx.margin + " puntos a las demás rutas: ordenar la deuda costosa libera capacidad " +
        "y hace sostenible el crédito siguiente."
      );
    }

    return (
      "<strong>Otorgar ahora</strong> supera por " + ctx.margin + " puntos a las alternativas: " +
      "la capacidad proyectada se sostiene durante los doce meses sin tensionar el hogar."
    );
  }

  ORIGEN.domain.narrative = { explainDecision, explainProjection };
})(window.ORIGEN);
