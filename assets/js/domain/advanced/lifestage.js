/**
 * ORIGEN · Motor avanzado — etapa de vida y su política
 * ---------------------------------------------------------------------------
 * Infiere la etapa y devuelve, junto con ella, la política que impone: cuota
 * tolerable, plazo máximo, productos que se priorizan, productos que se evitan
 * y el tono con el que hay que hablarle.
 *
 * Es más rica que la del motor base: no solo clasifica, también explica por qué
 * y qué implica. Esa razón se muestra literalmente al analista.
 *
 * Los productos que prioriza o evita se nombran con su etiqueta comercial
 * completa, porque el motor avanzado delibera sobre nombres y no sobre claves.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  /** Las cinco etapas, en orden de progresión vital. */
  const STAGES = [
    "Inicio laboral",
    "Formación de hogar",
    "Crianza y expansión",
    "Consolidación",
    "Madurez y protección",
  ];

  /**
   * Política por etapa.
   *
   * PENDIENTE DE CALIBRAR: las cuotas tolerables (22 %–32 %) son supuestos de
   * la demostración y coinciden con las del motor base. Deben alinearse con la
   * matriz de riesgo vigente de Colsubsidio.
   */
  const POLICY = {
    "Inicio laboral": {
      installmentTolerance: 0.22,
      maxTermMonths: 24,
      prioritise: ["Cupo de crédito rotativo", "Crédito educativo"],
      avoid: ["Crédito hipotecario"],
      tone: "cercano y pedagógico",
      note: "Cupos iniciales bajos y escalonados: cada cumplimiento amplía la capacidad.",
    },
    "Formación de hogar": {
      installmentTolerance: 0.3,
      maxTermMonths: 180,
      prioritise: ["Crédito hipotecario", "Crédito de mujeres", "Crédito de consumo"],
      avoid: [],
      tone: "acompañante, orientado al proyecto",
      note: "Es la etapa donde el crédito construye patrimonio: se privilegia plazo largo y cuota sostenible.",
    },
    "Crianza y expansión": {
      installmentTolerance: 0.25,
      maxTermMonths: 60,
      prioritise: ["Crédito educativo", "Cupo de crédito rotativo", "Crédito de consumo"],
      avoid: ["Crédito hipotecario"],
      tone: "práctico y previsivo",
      note: "Gastos fijos del hogar elevados: se reduce la cuota tolerable y se privilegia liquidez sobre monto.",
    },
    Consolidación: {
      installmentTolerance: 0.32,
      maxTermMonths: 120,
      prioritise: ["Crédito de consumo", "Crédito hipotecario", "Rotativo para seguros e impuestos"],
      avoid: [],
      tone: "directo y patrimonial",
      note: "Mayor margen: es el momento óptimo para ordenar deuda cara y decisiones de largo plazo.",
    },
    "Madurez y protección": {
      installmentTolerance: 0.25,
      maxTermMonths: 36,
      prioritise: ["Crédito de consumo", "Rotativo para seguros e impuestos"],
      avoid: ["Crédito hipotecario"],
      tone: "prudente y protector",
      note: "Horizonte laboral más corto: plazos que terminen dentro de la vida laboral activa.",
    },
  };

  /**
   * Infiere la etapa de vida y devuelve su política.
   *
   * Las reglas se evalúan en orden y la primera que coincide gana. El orden es
   * la política: la edad avanzada manda sobre todo lo demás, después los
   * beneficiarios a cargo, después las señales de constitución de hogar.
   *
   * @param {object} profile Perfil de domain/advanced/profile.js
   * @returns {object} Etapa, razón, política e índice en STAGES.
   */
  function inferStage(profile) {
    const age = profile.age;
    const dependents = profile.beneficiaries;
    const events = profile.events;

    let stage;
    let reason;

    if (age >= 50) {
      stage = "Madurez y protección";
      reason =
        "Edad y horizonte laboral: la prioridad es proteger el patrimonio, no expandir deuda.";
    } else if (dependents >= 1 && age >= 28 && age < 50) {
      stage = "Crianza y expansión";
      reason =
        dependents + " " + (dependents === 1 ? "beneficiario" : "beneficiarios") +
        " a cargo: los gastos fijos del hogar condicionan la cuota prudente.";
    } else if (
      (events.indexOf("postulación a vivienda") !== -1 ||
        events.indexOf("nuevo beneficiario registrado") !== -1 ||
        profile.hasPartner) &&
      age >= 26 &&
      age < 42 &&
      dependents <= 1
    ) {
      stage = "Formación de hogar";
      reason =
        "Señales de constitución de hogar: es la etapa donde el crédito construye patrimonio.";
    } else if (
      age >= 38 &&
      age < 50 &&
      profile.incomeTrend !== "decreciente" &&
      profile.affiliationYears >= 5
    ) {
      stage = "Consolidación";
      reason = "Trayectoria madura e ingreso sostenido: mayor margen para decisiones de largo plazo.";
    } else if (age < 29 && profile.affiliationYears < 5) {
      stage = "Inicio laboral";
      reason =
        "Está construyendo su historia financiera: montos pequeños que crezcan con el cumplimiento.";
    } else {
      stage = "Consolidación";
      reason = "Trayectoria estable sin eventos de inflexión recientes.";
    }

    const policy = POLICY[stage];

    return {
      stage,
      reason,
      installmentTolerance: policy.installmentTolerance,
      maxTermMonths: policy.maxTermMonths,
      prioritise: policy.prioritise,
      avoid: policy.avoid,
      tone: policy.tone,
      note: policy.note,
      index: STAGES.indexOf(stage),
    };
  }

  ORIGEN.domain.advanced.lifestage = { inferStage, STAGES, POLICY };
})(window.ORIGEN);
