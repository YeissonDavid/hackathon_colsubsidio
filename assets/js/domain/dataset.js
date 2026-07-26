/**
 * ORIGEN · Conjunto de decisiones de la sesión
 * ---------------------------------------------------------------------------
 * Construye la población y delibera sobre ella una sola vez, al arrancar. El
 * resto de la aplicación consulta este conjunto: ninguna vista genera datos ni
 * vuelve a decidir por su cuenta.
 *
 * Aquí vive también el estado de resoluciones tomadas por el analista durante
 * la sesión. Es el único estado mutable del sistema y está deliberadamente
 * concentrado en un sitio, con acceso por función, en lugar de repartido en
 * variables globales.
 *
 * Dependencias: core/namespace.js, core/config.js, domain/{population,decision}.js
 */
(function (ORIGEN) {
  "use strict";

  /** @type {object[]} Registros de decisión, en el orden de la población. */
  let decisions = [];

  /** @type {Record<number, string>} Índice de decisión → acción del analista. */
  const resolutions = {};

  /**
   * Genera la población y delibera sobre cada afiliado.
   * Idempotente: llamarla de nuevo reconstruye el conjunto desde la semilla.
   *
   * @param {number} [seed] Semilla alternativa, para pruebas.
   * @returns {object[]}
   */
  function build(seed) {
    decisions = ORIGEN.domain.population.buildPopulation(seed).map(ORIGEN.domain.decide);
    // El índice es la identidad estable de una decisión dentro de la sesión:
    // la bandeja, el buscador y el registro de resoluciones lo comparten.
    decisions.forEach(function (decision, index) {
      decision.index = index;
    });
    return decisions;
  }

  /** Todas las decisiones. */
  function all() {
    return decisions;
  }

  /** Una decisión por su índice. */
  function at(index) {
    return decisions[index];
  }

  /** Número de decisiones que cumplen un predicado. */
  function countBy(predicate) {
    return decisions.filter(predicate).length;
  }

  /** Reparto de decisiones por el valor que devuelva `keyOf`. */
  function groupCount(keyOf, includeInDenominator) {
    const counts = {};
    decisions.forEach(function (decision) {
      if (includeInDenominator && !includeInDenominator(decision)) return;
      const key = keyOf(decision);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  /**
   * Busca por cédula o por nombre, sin distinguir mayúsculas ni acentos.
   *
   * Busca siempre sobre el dato real, no sobre el enmascarado: el analista
   * escribe la cédula que tiene delante y debe encontrarla aunque la pantalla
   * la esté mostrando censurada.
   *
   * @param {string} query
   * @returns {object|undefined}
   */
  function find(query) {
    const needle = query.trim().toLowerCase();
    if (!needle) return undefined;

    return decisions.find(function (decision) {
      const a = decision.affiliate;
      return (
        a.id.toLowerCase().includes(needle) || a.name.toLowerCase().includes(needle)
      );
    });
  }

  /** Registra la acción que el analista tomó sobre una decisión. */
  function resolve(index, action) {
    resolutions[index] = action;
  }

  /** Acción registrada para una decisión, si existe. */
  function resolutionOf(index) {
    return resolutions[index];
  }

  ORIGEN.domain.dataset = {
    build,
    all,
    at,
    countBy,
    groupCount,
    find,
    resolve,
    resolutionOf,
  };
})(window.ORIGEN);
