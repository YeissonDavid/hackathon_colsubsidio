/**
 * ORIGEN · Motor avanzado — enriquecimiento y señales
 * ---------------------------------------------------------------------------
 * `enrich` construye el perfil completo de una cédula consultando las fuentes
 * que estén activas. Una fuente apagada no devuelve cero: devuelve `null`, que
 * significa «no se sabe». La distinción importa — el motor no puede tratar
 * «sin deuda externa» igual que «no consultamos la central».
 *
 * `weighSignals` reparte 100 puntos entre las señales disponibles. Es la base
 * de la explicabilidad del simulador: el analista ve qué pesó y cuánto.
 *
 * Dependencias: core/namespace.js, domain/advanced/{hash,sources}.js
 */
(function (ORIGEN) {
  "use strict";

  const { unit, integer } = ORIGEN.domain.advanced.derive;
  const { SMMLV } = ORIGEN.domain.advanced.sources;

  /** Intenciones detectables en los canales digitales propios. */
  const INTENTS = [
    "ninguna",
    "remodelación del hogar",
    "equipo de trabajo y tecnología",
    "estudio o formación",
    "vivienda",
  ];

  /** Canales de preferencia declarados. */
  const CHANNEL_PREFERENCES = ["app", "whatsapp", "email"];

  /** Tendencias de ingreso posibles. */
  const INCOME_TRENDS = ["creciente", "estable", "decreciente"];

  /**
   * Eventos de vida detectables, con el umbral por encima del cual se activan.
   * Umbrales altos a propósito: un evento es excepcional, no la norma.
   */
  const LIFE_EVENTS = [
    { attribute: "ev1", threshold: 0.72, label: "nuevo beneficiario registrado" },
    { attribute: "ev2", threshold: 0.8, label: "matrícula escolar próxima" },
    { attribute: "ev3", threshold: 0.86, label: "postulación a vivienda" },
    { attribute: "ev4", threshold: 0.88, label: "renovación de pólizas e impuestos" },
  ];

  /** Cuota mensual estimada de la deuda externa, como fracción del saldo. */
  const EXTERNAL_PAYMENT_RATIO = 0.045;

  /**
   * Número de beneficiarios a cargo, según la edad.
   * La curva sube hasta la mediana edad y vuelve a bajar: los hijos crecen.
   */
  function beneficiaries(id, age) {
    if (age < 25) return integer(id, "ben", 0, 1);
    if (age < 34) return integer(id, "ben", 0, 2);
    if (age < 48) return integer(id, "ben", 0, 3);
    return integer(id, "ben", 0, 2);
  }

  /**
   * Caché de perfiles.
   *
   * `enrich` es una función pura: el mismo (cédula, ingreso, fuentes) devuelve
   * siempre el mismo perfil, porque todo sale de un hash. Cachear es por tanto
   * seguro y no cambia ningún resultado.
   *
   * Importa para el Laboratorio: con 20.000 afiliados y un estudio de ablación
   * de 5 escenarios, la misma cédula se enriquece muchas veces con las mismas
   * fuentes. Sin caché el experimento bloquea la pestaña casi un minuto.
   *
   * Se limpia al superar el tope para no crecer sin control en una sesión larga.
   */
  const cache = new Map();
  const CACHE_LIMIT = 60000;

  /** Clave estable para el estado de fuentes. */
  function cacheKey(id, reportedIncome, enabled) {
    let flags = "";
    ORIGEN.domain.advanced.sources.SOURCES.forEach(function (source) {
      flags += enabled[source.key] ? "1" : "0";
    });
    return id + "|" + (reportedIncome || "") + "|" + flags;
  }

  /** Vacía la caché. Útil en pruebas y al medir tiempos en frío. */
  function clearCache() {
    cache.clear();
  }

  /**
   * Construye el perfil enriquecido de una cédula.
   *
   * @param {string} id Cédula.
   * @param {number|null} reportedIncome Ingreso declarado, si el analista lo tiene.
   * @param {object} enabled Mapa de fuentes activas.
   * @returns {object} Perfil. Los campos de fuentes apagadas valen null.
   */
  function enrich(id, reportedIncome, enabled) {
    const key = cacheKey(id, reportedIncome, enabled);
    const hit = cache.get(key);
    if (hit) return hit;

    const profile = computeProfile(id, reportedIncome, enabled);

    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(key, profile);

    return profile;
  }

  /** Cálculo real del perfil, sin caché. */
  function computeProfile(id, reportedIncome, enabled) {
    const gender = unit(id, "gen") > 0.48 ? "F" : "M";
    const age = integer(id, "edad", 22, 58);

    // La antigüedad de afiliación no puede exceder los años desde los 20.
    const affiliationYears = Math.min(integer(id, "ant", 1, 18), Math.max(1, age - 20));
    const employmentMonths = integer(id, "emp", 1, 84);
    const isPermanent = unit(id, "contr") > 0.38;

    // Un ingreso declarado por el analista vale más que uno inferido: se marca.
    const incomeIsReported = Boolean(reportedIncome);
    const income = reportedIncome
      ? +reportedIncome
      : Math.round((SMMLV * (0.95 + unit(id, "ing") * 6.2)) / 50000) * 50000;

    // --- Centrales de información ---
    let obligations = integer(id, "obl", 0, 4);
    let externalBalance = 0;
    let maxRate = 0;

    for (let i = 0; i < obligations; i++) {
      externalBalance += integer(id, "s" + i, 600, 7200) * 1000;
      maxRate = Math.max(maxRate, 18 + integer(id, "t" + i, 0, 15));
    }

    if (!enabled.bureau) {
      // null, no 0: «no consultado» no es «sin deuda».
      obligations = null;
      externalBalance = 0;
      maxRate = 0;
    }

    const externalPayment = externalBalance > 0 ? externalBalance * EXTERNAL_PAYMENT_RATIO : 0;

    const events = LIFE_EVENTS.filter(function (event) {
      return unit(id, event.attribute) > event.threshold;
    }).map(function (event) {
      return event.label;
    });

    return {
      id,
      gender,
      age,
      affiliationYears,
      employmentMonths,
      isPermanent,
      income,
      incomeIsReported,
      obligations,
      externalBalance,
      maxRate,
      externalPayment,
      events,

      // Data alternativa
      regularIncomeMonths: enabled.alt ? integer(id, "reg", 0, 30) : null,
      // Registros públicos
      hasRues: enabled.pub ? unit(id, "rues") > 0.82 : null,
      // Canales digitales
      digitalScore: enabled.dig ? Math.round(unit(id, "dig") * 100) : null,
      intent: enabled.dig ? INTENTS[integer(id, "int", 0, 4)] : null,
      // Contactabilidad
      hasEmail: enabled.cont ? unit(id, "mail") > 0.12 : null,
      preferredChannel: enabled.cont ? CHANNEL_PREFERENCES[integer(id, "cp", 0, 2)] : null,

      // Internas: siempre disponibles, no dependen de fuentes externas
      networkUsage: Math.round(unit(id, "red") * 100),
      paymentBehaviour: 60 + Math.round(unit(id, "pag") * 40),
      beneficiaries: beneficiaries(id, age),
      hasPartner: unit(id, "par") > 0.45,
      internalCreditMonthsLeft: unit(id, "ci") > 0.55 ? integer(id, "cir", 1, 14) : 0,
      incomeTrend:
        INCOME_TRENDS[unit(id, "ti") > 0.62 ? 0 : unit(id, "ti") > 0.2 ? 1 : 2],
    };
  }

  /**
   * Reparte 100 puntos entre las señales disponibles, ordenadas por peso.
   *
   * Cada señal declara su fuente para que el analista sepa si el peso viene de
   * dato interno o de enriquecimiento exógeno. Las señales de fuentes apagadas
   * simplemente no entran, y el reparto se recalcula sobre las que quedan.
   *
   * @returns {Array<{name: string, value: number, source: string, weight: number}>}
   */
  function weighSignals(profile, enabled) {
    const signals = [];

    function add(name, value, source) {
      signals.push({ name, value, source });
    }

    // --- Internas ---
    add(
      "Estabilidad laboral y antigüedad",
      Math.min(1, (profile.employmentMonths / 60) * 0.6 + (profile.affiliationYears / 12) * 0.4),
      "Interno · afiliación"
    );
    add(
      "Comportamiento de pago interno",
      (profile.paymentBehaviour - 60) / 40,
      "Interno · productos vigentes"
    );
    add(
      "Uso de la red de servicios",
      profile.networkUsage / 100,
      "Interno · salud, educación, recreación"
    );
    add(
      "Evento de vida",
      profile.events.length ? Math.min(1, 0.45 + profile.events.length * 0.22) : 0.05,
      "Interno · afiliación"
    );

    // --- Exógenas, solo si la fuente está activa ---
    if (enabled.bureau) {
      add(
        "Endeudamiento externo detectado",
        profile.externalBalance > 0
          ? Math.min(1, profile.externalPayment / (profile.income * 0.35))
          : 0.02,
        "Exógena · centrales de información"
      );
    }
    if (enabled.alt) {
      add(
        "Regularidad de ingresos no bancarizados",
        profile.regularIncomeMonths / 30,
        "Exógena · data alternativa"
      );
    }
    if (enabled.pub) {
      add(
        "Actividad económica registrada",
        profile.hasRues ? 0.6 : 0.05,
        "Exógena · registros públicos"
      );
    }
    if (enabled.dig) {
      add(
        "Intención digital reciente",
        profile.intent === "ninguna" ? 0.08 : 0.35 + profile.digitalScore / 160,
        "Interno · canales digitales"
      );
    }

    const total =
      signals.reduce(function (sum, signal) {
        return sum + signal.value;
      }, 0) || 1;

    return signals
      .map(function (signal) {
        return {
          name: signal.name,
          value: signal.value,
          source: signal.source,
          weight: Math.round((signal.value / total) * 1000) / 10,
        };
      })
      .sort(function (a, b) {
        return b.weight - a.weight;
      });
  }

  ORIGEN.domain.advanced.profile = { enrich, weighSignals, clearCache, INTENTS };
})(window.ORIGEN);
