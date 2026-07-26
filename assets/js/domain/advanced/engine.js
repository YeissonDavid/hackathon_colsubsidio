/**
 * ORIGEN · Motor avanzado — orquestador
 * ---------------------------------------------------------------------------
 * Consulta individual: de una cédula a una decisión completa, con las fuentes
 * que se le indiquen.
 *
 * Diferencias frente al motor base (domain/decision.js), que son el motivo de
 * que existan los dos:
 *
 *   · Entrada       una cédula cualquiera, no una población pregenerada
 *   · Determinismo  por hash de la cédula, no por semilla y orden
 *   · Fuentes       conmutables una por una, con el efecto visible en directo
 *   · Veredictos    cuatro, incluido «viable pero mejor después»
 *   · Descartes     cada producto que pierde explica por qué
 *
 * El motor base sirve la bandeja y el lote. Este sirve el simulador, el
 * comparador y el laboratorio. Comparten el catálogo de etapas de vida y los
 * topes de cuota, pero no el código — ver docs/MEJORAS.md §2.1.
 *
 * Dependencias: core/namespace.js, domain/advanced/*
 */
(function (ORIGEN) {
  "use strict";

  const advanced = ORIGEN.domain.advanced;

  /**
   * Delibera sobre una cédula.
   *
   * @param {string} id Cédula.
   * @param {number|null} [reportedIncome] Ingreso declarado, si se conoce.
   * @param {object} [enabled] Fuentes activas; por defecto todas.
   * @returns {object} Decisión con perfil, señales, etapa, alternativas y entrega.
   */
  function decide(id, reportedIncome, enabled) {
    const sources = enabled || advanced.sources.allEnabled();

    const profile = advanced.profile.enrich(id, reportedIncome, sources);
    const signals = advanced.profile.weighSignals(profile, sources);
    const stage = advanced.lifestage.inferStage(profile);

    const eligibility = advanced.policy.assessEligibility(profile, sources, stage);
    const alternatives = advanced.deliberation.deliberate(profile, eligibility, sources, stage);
    const window = advanced.policy.findWindow(profile, stage, eligibility);

    // Un perfil viable al que le conviene esperar recibe su propio veredicto:
    // ni un «sí» que lo empuja hoy, ni un «no» que lo desanima.
    if (eligibility.status !== "no" && window.shouldWait) {
      eligibility.status = "espera";
    }

    const best = alternatives[0];

    return {
      profile,
      signals,
      stage,
      eligibility,
      alternatives,
      best,
      window,
      delivery: advanced.delivery.selectDelivery(profile, eligibility, sources),
      confidence: advanced.deliberation.assessConfidence(profile, signals, sources),
      message: advanced.delivery.compose(profile, eligibility, best, stage, window),
    };
  }

  advanced.decide = decide;
})(window.ORIGEN);
