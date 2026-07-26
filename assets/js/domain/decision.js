/**
 * ORIGEN · Orquestador de la decisión
 * ---------------------------------------------------------------------------
 * Encadena el motor completo para un afiliado y devuelve un único registro de
 * decisión, autocontenido y auditable.
 *
 * Secuencia — el orden es la política:
 *
 *   1. Capacidad     ¿cuánta cuota tolera su momento de vida?
 *   2. Deliberación  ¿qué producto encaja mejor con sus señales?
 *   3. Dimensión     ¿cuánto se puede prestar sin romper la política?
 *   4. Proyección    ¿qué camino lo deja mejor a doce meses?
 *   5. Veredicto     el camino ganador decide, no el producto
 *   6. Entrega       canal y franja horaria
 *   7. Narrativa     la razón en lenguaje natural
 *
 * El monto se calcula DESPUÉS de conocer el tope de cuota, nunca antes. Y el
 * veredicto lo fija la proyección de bienestar, no la apetencia comercial: es
 * lo que permite que «no prestar» sea un resultado legítimo del motor.
 *
 * Dependencias: core/namespace.js, core/config.js, core/math.js,
 *               core/catalog.js, domain/{scoring,capacity,projection,
 *               engagement,narrative}.js
 */
(function (ORIGEN) {
  "use strict";

  const { clamp } = ORIGEN.core.math;

  /** Edad a partir de la cual se prefiere WhatsApp sobre notificación push. */
  const SENIOR_AGE = 55;

  /** Antigüedad por debajo de la cual la resolución se marca «con condiciones». */
  const SHORT_TENURE_MONTHS = 8;

  /** Meses de ingreso no bancarizado que dejan de considerarse incipientes. */
  const UNBANKED_CONSOLIDATED_MONTHS = 12;

  /**
   * Confianza declarada del motor.
   *
   * Es una autoevaluación honesta, no una probabilidad: sube con la fuerza de
   * la señal que sustenta el producto y baja cuando el perfil tiene menos
   * historial verificable. Se muestra al analista para que sepa cuánto peso
   * dar a la recomendación.
   */
  function assessConfidence(affiliate, productScore, verdict) {
    const c = ORIGEN.config.confidence;

    let confidence = c.base + Math.min(c.scoreBonusCap, productScore / c.scoreDivisor);

    if (affiliate.isSelfEmployed) confidence -= c.penaltyIndependiente;
    if (affiliate.tenureMonths < SHORT_TENURE_MONTHS) confidence -= c.penaltyShortTenure;
    // Un historial largo de ingresos no bancarizados es señal buena, no ruido.
    if (affiliate.unbankedIncomeMonths >= UNBANKED_CONSOLIDATED_MONTHS) confidence += c.bonusUnbanked;

    // Nunca se declara alta confianza en una negativa: la ruta de bienestar
    // siempre admite revisión humana.
    if (verdict === "no_viable") confidence = Math.min(confidence, c.maxWhenNotViable);

    return clamp(confidence, c.min, c.max);
  }

  /**
   * Canal de entrega.
   *
   * El orden de las reglas es la preferencia declarada: una negativa siempre va
   * por voz humana; los mayores no reciben push (alta tasa de deshabilitación);
   * los productos de trámite largo van por correo, que admite adjuntos; una
   * intención reciente se aprovecha en caliente con push.
   */
  function selectChannel(affiliate, product, verdict) {
    if (verdict === "no_viable") return "Asesor humano";
    if (affiliate.age > SENIOR_AGE) return "WhatsApp";
    if (product === "hipotecario" || product === "educativo") return "Correo electrónico";
    if (affiliate.intentIsRecent) return "Notificación push";
    return "WhatsApp";
  }

  /**
   * ¿Debe la resolución ejecutarse en secuencia —cartera primero, objetivo
   * después— en lugar de como una sola operación?
   *
   * Se reserva para el caso en que ordenar la deuda es condición para que el
   * producto que la persona realmente necesita sea sostenible.
   */
  function needsSequencing(affiliate, product, verdict) {
    return (
      product === "cartera" &&
      affiliate.gender === "F" &&
      (affiliate.lifeStage === "formacion" || affiliate.lifeStage === "crianza") &&
      verdict !== "no_viable"
    );
  }

  /** Traduce el escenario ganador al veredicto que ve el analista. */
  function resolveVerdict(affiliate, winner) {
    if (winner === "route") return "no_viable";
    if (winner === "wait") return "mejor_momento";

    // Otorgar hoy, pero el perfil exige condiciones: poca trayectoria
    // verificable o ingresos aún no consolidados.
    const needsConditions =
      affiliate.isSelfEmployed ||
      affiliate.tenureMonths < SHORT_TENURE_MONTHS ||
      (affiliate.unbankedIncomeMonths > 0 &&
        affiliate.unbankedIncomeMonths < UNBANKED_CONSOLIDATED_MONTHS);

    return needsConditions ? "viable_condiciones" : "viable";
  }

  /**
   * Delibera sobre un afiliado y devuelve su registro de decisión.
   *
   * @param {object} affiliate
   * @returns {object} Registro de decisión completo.
   */
  function decide(affiliate) {
    const { capacity, scoring, projection, engagement, narrative } = ORIGEN.domain;

    // 1. Cuánto espacio de cuota permite su momento de vida.
    const headroomInfo = capacity.assessHeadroom(affiliate);

    // 2. Deliberación sobre las siete líneas.
    const { best: product, totals } = scoring.scoreProducts(affiliate);
    const ranking = scoring.rankPortfolio(totals);

    // 3. Dimensionamiento y verificación de política.
    const operation = capacity.sizeOperation(affiliate, product, headroomInfo);

    // 4. Proyección de los tres caminos.
    const projected = projection.project(
      affiliate,
      product,
      headroomInfo.headroom,
      operation.policy.blocked
    );

    // 5. El camino ganador fija el veredicto.
    const winner = projection.winningScenario(projected);
    const verdict = resolveVerdict(affiliate, winner);
    const isSequenced = needsSequencing(affiliate, product, verdict);

    // 6. Entrega: canal y ventana de contacto.
    const peak = engagement.findPeak(affiliate.engagementMatrix);
    const channel = selectChannel(affiliate, product, verdict);

    // 7. Narrativa.
    const reason = narrative.explainDecision({
      affiliate,
      product,
      verdict,
      isSequenced,
      freedCashFlow: operation.freedCashFlow,
    });

    return {
      affiliate,
      product,
      ranking,
      totals,

      verdict,
      winningScenario: winner,
      isSequenced,
      confidence: assessConfidence(affiliate, totals[product] ? totals[product].sum : 0, verdict),

      // Dimensionamiento
      amount: operation.amount,
      installment: operation.installment,
      termMonths: operation.termMonths,
      note: operation.note,
      modality: operation.modality,
      libranzaCap: operation.libranzaCap,
      externalPayment: operation.externalPayment,
      substitutes: operation.substitutes,
      freedCashFlow: operation.freedCashFlow,
      finalLoad: operation.finalLoad,
      minTenure: operation.minTenure,
      policy: operation.policy,

      // Capacidad
      maxInstallment: headroomInfo.maxInstallment,
      committed: headroomInfo.committed,
      availableInstallment: headroomInfo.availableInstallment,
      headroom: headroomInfo.headroom,

      // Proyección
      projection: projected,

      // Entrega
      channel,
      peakDay: peak.day,
      peakHour: peak.hour,
      contactWindowLabel: engagement.formatWindow(peak),

      reason,
    };
  }

  ORIGEN.domain.decide = decide;
})(window.ORIGEN);
