/**
 * ORIGEN · Motor avanzado — deliberación y confianza
 * ---------------------------------------------------------------------------
 * Puntúa las alternativas de 0 a 10 y las ordena. A diferencia del motor base,
 * aquí cada alternativa lleva su propio motivo de DESCARTE: los productos que
 * pierden explican por qué, en lugar de aparecer con un cero mudo.
 *
 * Después, la política de la etapa de vida ajusta el orden: sube 1,3 puntos lo
 * que la etapa prioriza y baja 2,2 lo que desaconseja. Así el momento vital
 * puede cambiar la recomendación sin reescribir las reglas de producto.
 *
 * `assessConfidence` (DCI) mide cuánto crédito darle a la propia decisión, y
 * baja sola cuando faltan fuentes. Es la métrica que hace visible el valor del
 * enriquecimiento en el simulador.
 *
 * Dependencias: core/namespace.js, core/format.js,
 *               domain/advanced/{sources,hash}.js
 */
(function (ORIGEN) {
  "use strict";

  const { SOURCES, SMMLV } = ORIGEN.domain.advanced.sources;

  /** Ajuste de puntaje que aplica la etapa de vida. */
  const STAGE_BOOST = 1.3;
  const STAGE_PENALTY = 2.2;

  /** Límites del cupo rotativo. */
  const CUPO_MIN = 150000;
  const CUPO_MAX = 5000000;

  /** Alivio mensual estimado al unificar deuda externa. */
  const CONSOLIDATION_RELIEF = 0.28;

  /**
   * Delibera sobre las alternativas del portafolio.
   *
   * @param {object} profile
   * @param {object} eligibility Resultado de policy.assessEligibility.
   * @param {object} enabled Fuentes activas.
   * @param {object} stage Resultado de lifestage.inferStage.
   * @returns {Array<object>} Alternativas ordenadas de mejor a peor.
   */
  function deliberate(profile, eligibility, enabled, stage) {
    const { money } = ORIGEN.core.format;

    const libranzaCap = profile.income <= SMMLV ? 1500000 : profile.income * 3;

    // Cupo redondeado a múltiplos de 50.000, acotado al rango comercial.
    const cupo = Math.max(
      CUPO_MIN,
      Math.min(CUPO_MAX, Math.round((eligibility.maxInstallment * 11) / 50000) * 50000)
    );

    const alternatives = [];

    function add(product, score, description, conditions, modality, dismissal) {
      alternatives.push({
        product,
        score: Math.round(score * 10) / 10,
        description: description || "",
        conditions: conditions || [],
        modality: modality || "—",
        dismissal: dismissal || "",
      });
    }

    // Bloqueado por política: la única alternativa es acompañar.
    if (eligibility.status === "no") {
      add("Ruta de fortalecimiento", 9.6, "Educación financiera y recalificación en 6 meses.");
      add("Cualquier crédito", 2.1, "", [], "—", "Descartada por protección.");
      return alternatives;
    }

    const lender = profile.isPermanent ? "Libranza" : "Libre";

    // --- Crédito de consumo: ordenar deuda externa cara ------------------
    if (enabled.bureau && profile.obligations >= 2 && profile.maxRate >= 24) {
      const relief = profile.externalPayment * CONSOLIDATION_RELIEF;
      add(
        "Crédito de consumo",
        8.4 + Math.min(1.4, profile.obligations * 0.3),
        "Unifica " + profile.obligations + " obligaciones por " + money(profile.externalBalance) +
          ". Libera " + money(relief) + " al mes.",
        [["Saldo", money(profile.externalBalance)], ["Alivio mensual", "≈ " + money(relief)]],
        lender
      );
    } else if (enabled.bureau) {
      add("Crédito de consumo", 2.4, "", [], "—", "Sin deuda cara para unificar.");
    } else {
      add("Crédito de consumo", 0, "", [], "—", "No evaluable (sin buró).");
    }

    // --- Crédito hipotecario -------------------------------------------
    const wantsHousing =
      profile.events.indexOf("postulación a vivienda") !== -1 || profile.intent === "vivienda";

    if (wantsHousing && eligibility.maxInstallment > 700000) {
      add(
        "Crédito hipotecario",
        8.9,
        "Compra de vivienda en UVR o pesos.",
        [["Cuota sostenible", money(eligibility.maxInstallment)]],
        "Libranza"
      );
    } else {
      add(
        "Crédito hipotecario",
        wantsHousing ? 4.2 : 1.6,
        "",
        [],
        "—",
        "Sin señales de vivienda o cuota insuficiente."
      );
    }

    // --- Crédito educativo ---------------------------------------------
    const wantsEducation =
      profile.events.indexOf("matrícula escolar próxima") !== -1 ||
      profile.intent === "estudio o formación";

    if (wantsEducation) {
      add(
        "Crédito educativo",
        8.6,
        "Financia estudios alineados al calendario académico.",
        [["Cuota sostenible", money(eligibility.maxInstallment)]],
        lender
      );
    } else {
      add("Crédito educativo", 1.9, "", [], "—", "Sin matrícula próxima.");
    }

    // --- Rotativo para seguros e impuestos -----------------------------
    if (profile.events.indexOf("renovación de pólizas e impuestos") !== -1) {
      add(
        "Rotativo para seguros e impuestos",
        8.2,
        "Financia impuestos y pólizas próximas.",
        [["Cupo asignado", money(cupo)]],
        "Cupo"
      );
    } else {
      add("Rotativo para seguros e impuestos", 1.4, "", [], "—", "Sin vencimientos detectados.");
    }

    // --- Crédito de mujeres --------------------------------------------
    const hasActiveNeed =
      (profile.intent && profile.intent !== "ninguna") || profile.events.length > 0;

    if (profile.gender === "F" && hasActiveNeed) {
      add(
        "Crédito de mujeres",
        8.1,
        "Monto adaptable con protección oncológica.",
        [["Cupo asignado", money(cupo)], ["Beneficio", "protección oncológica"]],
        lender
      );
    } else {
      add(
        "Crédito de mujeres",
        profile.gender === "F" ? 3.1 : 0,
        "",
        [],
        "—",
        profile.gender === "F" ? "Sin necesidad activa." : "No aplica."
      );
    }

    // --- Cupo de crédito rotativo: siempre elegible --------------------
    add(
      "Cupo de crédito rotativo",
      6.4 + profile.networkUsage / 60,
      "Cupo reutilizable para el día a día.",
      [["Cupo asignado", money(cupo)], ["Tope", money(libranzaCap)]],
      "Cupo"
    );

    // --- Ajuste por etapa de vida --------------------------------------
    if (stage) {
      alternatives.forEach(function (alternative) {
        if (stage.prioritise.indexOf(alternative.product) !== -1) {
          alternative.score = Math.round((alternative.score + STAGE_BOOST) * 10) / 10;
        }
        // Solo se penaliza lo que era una opción real: si ya estaba descartada,
        // no tiene sentido volver a descartarlo.
        if (stage.avoid.indexOf(alternative.product) !== -1 && alternative.description) {
          alternative.score = Math.round((alternative.score - STAGE_PENALTY) * 10) / 10;
          alternative.dismissal = "Desaconsejado en etapa " + stage.stage;
        }
      });
    }

    return alternatives.sort(function (a, b) {
      return b.score - a.score;
    });
  }

  /**
   * Índice de confianza de la decisión (DCI), entre 0.35 y 0.97.
   *
   * Combina seis factores con pesos declarados. El más pesado es la
   * disponibilidad de fuentes: apagar centrales de información hunde el índice,
   * que es justo lo que se quiere demostrar.
   */
  function assessConfidence(profile, signals, enabled) {
    const availability =
      SOURCES.filter(function (source) {
        return enabled[source.key];
      }).length / SOURCES.length;

    const bureau = enabled.bureau ? 1 : 0.3;
    const trajectory = Math.min(1, profile.affiliationYears / 8);
    const stability = Math.min(1, profile.employmentMonths / 24);
    const incomeCertainty = profile.incomeIsReported ? 1 : 0.72;

    // Concentración: una señal que domina en exceso indica un perfil leído a
    // partir de un solo dato, y eso merece menos confianza.
    const concentration =
      1 - Math.min(1, Math.abs(signals[0].weight - 100 / signals.length) / 40);

    const value =
      0.26 * availability +
      0.24 * bureau +
      0.16 * trajectory +
      0.14 * stability +
      0.12 * incomeCertainty +
      0.08 * concentration;

    return Math.round(Math.max(0.35, Math.min(0.97, value)) * 100) / 100;
  }

  ORIGEN.domain.advanced.deliberation = { deliberate, assessConfidence };
})(window.ORIGEN);
