/**
 * ORIGEN · Laboratorio de evidencia
 * ---------------------------------------------------------------------------
 * Backtest sobre población sintética. Es la pieza que convierte «creemos que
 * esto funciona» en un número defendible.
 *
 * Método
 * ------
 * 1. `groundTruth` genera, para cada cédula, un resultado que el motor NO ve:
 *    si esa persona habría entrado en mora, y qué necesitaba de verdad. La mora
 *    depende de factores reales —carga externa, inestabilidad, un shock, la
 *    disciplina de pago—, así que hay una verdad que se puede acertar o fallar.
 *
 * 2. `baseline` simula el proceso tradicional: solo datos internos, un único
 *    producto para todos, aprobación por umbrales.
 *
 * 3. `run` compara ambos contra la verdad y cruza sus decisiones en cuatro
 *    cuadrantes:
 *
 *      Protegidos  la base aprobaba, ORIGEN frenó  → mora evitada
 *      Incluidos   la base rechazaba, ORIGEN aprobó → inclusión sana
 *      Comunes     ambos aprueban                   → cartera núcleo
 *      Ambos no    ambos rechazan                   → sin disputa
 *
 * 4. Además mide equidad por género, edad e ingreso, y hace un estudio de
 *    ablación: cuánto empeora la cartera al apagar cada fuente exógena. Eso
 *    convierte «los datos exógenos aportan» en el ROI exacto de pagarlos.
 *
 * ⚠ Es una simulación, no un backtest sobre cartera real. Los resultados
 *   demuestran que la LÓGICA discrimina bien sobre un mundo cuyas reglas
 *   conocemos; no predicen la mora de Colsubsidio. Decirlo en el pitch es
 *   mejor que esperar a que lo pregunten. Ver docs/MEJORAS.md §4.4.
 *
 * Dependencias: core/namespace.js, domain/advanced/*
 */
(function (ORIGEN) {
  "use strict";

  const advanced = ORIGEN.domain.advanced;
  const { unit, integer } = advanced.derive;

  /** Riesgo por encima del cual la persona entra en mora en el mundo simulado. */
  const DEFAULT_THRESHOLD = 0.42;

  /** Tamaño máximo de la muestra del estudio de ablación. */
  const ABLATION_SAMPLE = 1500;

  /** Qué producto responde de verdad a cada necesidad. */
  const NEED_TO_PRODUCT = {
    vivienda: "Crédito hipotecario",
    educación: "Crédito educativo",
    "ordenar deuda cara": "Crédito de consumo",
    "impuestos y seguros": "Rotativo para seguros e impuestos",
    "liquidez del día a día": "Cupo de crédito rotativo",
  };

  /**
   * La verdad que el motor no ve.
   *
   * Se calcula con TODAS las fuentes activas más un shock aleatorio que ningún
   * dato podría anticipar: sin ese término, el motor podría alcanzar el 100 % y
   * el experimento no diría nada.
   *
   * @returns {{defaults: boolean, risk: number, need: string, acceptsIfRelevant: boolean}}
   */
  function groundTruth(id) {
    const profile = advanced.profile.enrich(id, null, advanced.sources.allEnabled());

    const externalLoad = profile.income ? profile.externalPayment / profile.income : 0;
    const instability = 1 - Math.min(1, profile.employmentMonths / 36);
    const shock = unit(id, "shock");
    const discipline = (profile.paymentBehaviour - 60) / 40;

    const risk = 0.4 * externalLoad + 0.3 * instability + 0.26 * shock - 0.18 * discipline;

    let need = "liquidez del día a día";
    if (profile.events.indexOf("postulación a vivienda") !== -1 || profile.intent === "vivienda") {
      need = "vivienda";
    } else if (
      profile.events.indexOf("matrícula escolar próxima") !== -1 ||
      profile.intent === "estudio o formación"
    ) {
      need = "educación";
    } else if (profile.obligations >= 2 && profile.maxRate >= 24) {
      need = "ordenar deuda cara";
    } else if (profile.events.indexOf("renovación de pólizas e impuestos") !== -1) {
      need = "impuestos y seguros";
    }

    return {
      defaults: risk > DEFAULT_THRESHOLD,
      risk,
      need,
      acceptsIfRelevant: unit(id, "acep") > 0.35,
    };
  }

  /**
   * El proceso tradicional contra el que se compara: solo datos internos, un
   * único producto y umbrales fijos. No mira deuda externa — de ahí que apruebe
   * a gente con sobreendeudamiento invisible.
   */
  function baseline(id) {
    const profile = advanced.profile.enrich(id, null, {
      bureau: false,
      alt: false,
      pub: false,
      dig: false,
      cont: true,
    });

    const approves =
      profile.income >= advanced.sources.SMMLV * 1.15 &&
      profile.paymentBehaviour >= 68 &&
      profile.employmentMonths >= 2;

    return {
      approves,
      product: "Cupo de crédito rotativo",
      channel: "Correo electrónico",
    };
  }

  /** Cédula sintética estable para la iteración `i` del experimento. */
  function labId(i) {
    return String(integer("lab" + i, "z", 10000000, 99999999));
  }

  /** ¿La decisión de ORIGEN termina en aprobación? */
  function approvesOrigen(decision) {
    return decision.eligibility.status === "viable" || decision.eligibility.status === "cond";
  }

  /**
   * Ejecuta el experimento.
   *
   * @param {number} size Número de afiliados simulados.
   * @returns {object} Resultados agregados.
   */
  function run(size) {
    const result = {
      size,
      totalDefaults: 0,
      common: { count: 0, defaultsOrigen: 0, defaultsBaseline: 0 },
      protected: { count: 0, defaults: 0 },
      included: { count: 0, defaults: 0 },
      neitherApproves: { count: 0, defaults: 0 },
      origen: { approved: 0, relevant: 0, accepted: 0 },
      baseline: { approved: 0, relevant: 0, accepted: 0 },
      equity: {},
      ablation: {},
    };

    const equity = {};
    const allSources = advanced.sources.allEnabled();

    for (let i = 0; i < size; i++) {
      const id = labId(i);
      const truth = groundTruth(id);
      const decision = advanced.decide(id, null, advanced.sources.allEnabled());
      const base = baseline(id);

      if (truth.defaults) result.totalDefaults++;

      const origenApproves = approvesOrigen(decision);

      if (origenApproves) {
        result.origen.approved++;
        if (decision.best.product === NEED_TO_PRODUCT[truth.need]) {
          result.origen.relevant++;
          if (truth.acceptsIfRelevant) result.origen.accepted++;
        }
      }

      if (base.approves) {
        result.baseline.approved++;
        if (base.product === NEED_TO_PRODUCT[truth.need]) {
          result.baseline.relevant++;
          if (truth.acceptsIfRelevant) result.baseline.accepted++;
        }
      }

      // Los cuatro cuadrantes.
      if (base.approves && origenApproves) {
        result.common.count++;
        if (truth.defaults) {
          result.common.defaultsOrigen++;
          result.common.defaultsBaseline++;
        }
      } else if (base.approves && !origenApproves) {
        result.protected.count++;
        if (truth.defaults) result.protected.defaults++;
      } else if (!base.approves && origenApproves) {
        result.included.count++;
        if (truth.defaults) result.included.defaults++;
      } else {
        result.neitherApproves.count++;
        if (truth.defaults) result.neitherApproves.defaults++;
      }

      // Equidad: tasa de aprobación por grupo. Sirve para detectar sesgo, que
      // en crédito no es solo un problema ético sino regulatorio.
      const genderGroup = decision.profile.gender === "F" ? "Mujeres" : "Hombres";
      const ageGroup =
        decision.profile.age < 30 ? "18–29" : decision.profile.age < 45 ? "30–44" : "45+";
      const incomeGroup =
        decision.profile.income < advanced.sources.SMMLV * 2
          ? "Hasta 2 SMMLV"
          : decision.profile.income < advanced.sources.SMMLV * 4
            ? "2–4 SMMLV"
            : "Más de 4 SMMLV";

      [["Género", genderGroup], ["Edad", ageGroup], ["Ingreso", incomeGroup]].forEach(
        function (pair) {
          const dimension = pair[0];
          const group = pair[1];
          equity[dimension] = equity[dimension] || {};
          equity[dimension][group] = equity[dimension][group] || { count: 0, approved: 0 };
          equity[dimension][group].count++;
          if (origenApproves) equity[dimension][group].approved++;
        }
      );
    }

    result.equity = equity;

    // --- Estudio de ablación -------------------------------------------
    const sample = Math.min(size, ABLATION_SAMPLE);

    const scenarios = [
      ["completa", allSources],
      ["sin centrales", Object.assign(advanced.sources.allEnabled(), { bureau: false })],
      ["sin data alternativa", Object.assign(advanced.sources.allEnabled(), { alt: false })],
      ["sin registros públicos", Object.assign(advanced.sources.allEnabled(), { pub: false })],
      ["sin canales digitales", Object.assign(advanced.sources.allEnabled(), { dig: false })],
    ];

    scenarios.forEach(function (scenario) {
      const name = scenario[0];
      const sources = scenario[1];

      let approved = 0;
      let defaults = 0;
      let confidenceSum = 0;
      let blocked = 0;
      let blockedDefaults = 0;

      for (let i = 0; i < sample; i++) {
        const id = labId(i);
        const truth = groundTruth(id);
        const decision = advanced.decide(id, null, sources);

        confidenceSum += decision.confidence;

        if (approvesOrigen(decision)) {
          approved++;
          if (truth.defaults) defaults++;
        } else {
          blocked++;
          if (truth.defaults) blockedDefaults++;
        }
      }

      result.ablation[name] = {
        defaultRate: approved ? (defaults / approved) * 100 : 0,
        approved,
        confidence: confidenceSum / sample,
        precision: blocked ? (blockedDefaults / blocked) * 100 : 0,
      };
    });

    return result;
  }

  ORIGEN.domain.lab = { run, groundTruth, baseline, NEED_TO_PRODUCT };
})(window.ORIGEN);
