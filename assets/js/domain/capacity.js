/**
 * ORIGEN · Capacidad de pago y política de riesgo
 * ---------------------------------------------------------------------------
 * Convierte ingreso y compromisos en un monto sostenible, y comprueba las
 * reglas oficiales de viabilidad. Es la parte del motor que puede decir «no».
 *
 * El orden importa: primero se calcula cuánta cuota tolera el momento de vida,
 * después qué parte ya está comprometida, y solo con lo que queda libre se
 * calcula un monto. Nunca al revés — no se parte de un monto deseado para
 * después justificar la cuota.
 *
 * Dependencias: core/namespace.js, core/config.js, core/math.js, core/catalog.js
 */
(function (ORIGEN) {
  "use strict";

  const { clamp, monthlyRateFromAnnual, annuityFactor } = ORIGEN.core.math;

  /** Plazo máximo en meses con el que se calcula cualquier cuota. */
  const MAX_AMORTIZATION_MONTHS = 120;

  /** Plazo en el que se supone amortizada la deuda externa que se sustituye. */
  const EXTERNAL_DEBT_HORIZON_MONTHS = 22;

  /**
   * Vinculación mínima exigida a este afiliado, en meses.
   * Regla oficial: 2 meses con contrato indefinido, 6 en cualquier otro caso.
   */
  function requiredTenure(affiliate) {
    const { tenure } = ORIGEN.config;
    return affiliate.contractType === "indefinido" ? tenure.indefinido : tenure.otros;
  }

  /**
   * Tope de capacidad por libranza.
   * 1 SMMLV de ingreso habilita $1.500.000; el tope escala con el ingreso pero
   * nunca supera 3 veces el ingreso mensual.
   */
  function libranzaCap(affiliate) {
    const { SMMLV, libranza } = ORIGEN.config;
    const bySmmlv = libranza.perSmmlv * Math.max(1, Math.round(affiliate.income / SMMLV));
    const byIncome = affiliate.income * libranza.maxIncomeMultiple;
    return Math.min(byIncome, bySmmlv);
  }

  /**
   * Modalidad de desembolso admisible.
   * Ley 1527 de 2012: la libranza requiere vínculo laboral formal, así que
   * independientes y facultativos quedan fuera por norma, no por criterio.
   */
  function modality(affiliate) {
    if (affiliate.isSelfEmployed) return "No libranza / cupo";
    return affiliate.contractType === "indefinido" ? "Libranza" : "No libranza";
  }

  /**
   * Cuota mensual estimada de las obligaciones con otras entidades.
   * Se amortiza el saldo inferido a su tasa, a 22 meses.
   */
  function externalMonthlyPayment(affiliate) {
    if (affiliate.externalDebt.count === 0) return 0;
    const monthlyRate = monthlyRateFromAnnual(affiliate.externalDebt.annualRate);
    return (
      (affiliate.externalDebt.balance * monthlyRate) /
      (1 - Math.pow(1 + monthlyRate, -EXTERNAL_DEBT_HORIZON_MONTHS))
    );
  }

  /**
   * Espacio de cuota disponible según el momento de vida.
   *
   * @returns {{maxInstallment: number, committed: number,
   *            availableInstallment: number, headroom: number}}
   */
  function assessHeadroom(affiliate) {
    const stage = ORIGEN.core.catalog.LIFE_STAGES[affiliate.lifeStage];
    const maxInstallment = stage.maxInstallmentRatio * affiliate.income;
    const committed = affiliate.currentLoad * affiliate.income;
    const availableInstallment = Math.max(0, maxInstallment - committed);

    return {
      maxInstallment,
      committed,
      availableInstallment,
      headroom: clamp(availableInstallment / Math.max(maxInstallment, 1), 0, 1),
    };
  }

  /**
   * Dimensiona la operación para un producto dado.
   *
   * La compra de cartera es el único caso en que la capacidad crece: al
   * sustituir la obligación externa, su cuota deja de competir por el ingreso y
   * se suma al espacio disponible. Los demás productos solo pueden usar lo que
   * está libre hoy.
   *
   * @param {object} affiliate
   * @param {string} product Clave del catálogo.
   * @param {object} headroomInfo Resultado de assessHeadroom.
   * @returns {object} Dimensionamiento y verificación de política.
   */
  function sizeOperation(affiliate, product, headroomInfo) {
    const catalog = ORIGEN.core.catalog;
    const stage = catalog.LIFE_STAGES[affiliate.lifeStage];
    const { terms, monthlyRate } = catalog.PRODUCTS[product];

    const externalPayment = externalMonthlyPayment(affiliate);
    const target = terms.target(affiliate, { committed: headroomInfo.committed });

    const periods = Math.min(terms.termMonths, MAX_AMORTIZATION_MONTHS);
    const factor = annuityFactor(monthlyRate, periods);

    const capacity =
      product === "cartera"
        ? headroomInfo.availableInstallment + externalPayment
        : headroomInfo.availableInstallment;

    const amount = Math.max(0, Math.min(target, Math.max(0, capacity) * factor));
    const installment = amount > 0 ? amount / factor : 0;

    // ¿La operación sustituye la deuda externa en lugar de sumarse a ella?
    const substitutes = product === "cartera" && externalPayment > 0 && amount > 0;
    const freedCashFlow = substitutes ? Math.max(0, externalPayment - installment) : 0;

    const finalLoad = substitutes
      ? (headroomInfo.committed - externalPayment + installment) / affiliate.income
      : (headroomInfo.committed + installment) / affiliate.income;

    const minTenure = requiredTenure(affiliate);

    // Las tres razones por las que la política bloquea un desembolso.
    // El margen de 0.001 absorbe el error de coma flotante en la comparación
    // contra el tope: sin él, una carga de 0.3000000000000004 fallaría.
    const exceedsLoad = finalLoad > stage.maxInstallmentRatio + 0.001;
    const insufficientTenure = affiliate.tenureMonths < minTenure;
    const belowMinimum = amount < terms.minViable;

    return {
      amount,
      installment,
      termMonths: terms.termMonths,
      note: terms.note,
      externalPayment,
      substitutes,
      freedCashFlow,
      finalLoad,
      minTenure,
      modality: modality(affiliate),
      libranzaCap: libranzaCap(affiliate),
      policy: {
        exceedsLoad,
        insufficientTenure,
        belowMinimum,
        blocked: exceedsLoad || insufficientTenure || belowMinimum,
      },
    };
  }

  ORIGEN.domain.capacity = {
    requiredTenure,
    libranzaCap,
    modality,
    externalMonthlyPayment,
    assessHeadroom,
    sizeOperation,
    MAX_AMORTIZATION_MONTHS,
  };
})(window.ORIGEN);
