/**
 * ORIGEN · Utilidades numéricas
 * ---------------------------------------------------------------------------
 * Funciones puras sin estado. No dependen de configuración ni de dominio.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  /**
   * Acota un valor al intervalo [min, max].
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Curva de suavizado usada por las proyecciones: arranca rápido y se aplana.
   * Equivale a 1-(1-t)^2.1 sobre t normalizado en [0, 1].
   * @param {number} t Progreso normalizado.
   * @returns {number}
   */
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 2.1);
  }

  /**
   * Convierte una tasa efectiva anual (en porcentaje) a su equivalente mensual.
   * @param {number} annualPercent Tasa E.A. expresada como 28 para 28 %.
   * @returns {number} Tasa mensual en tanto por uno.
   */
  function monthlyRateFromAnnual(annualPercent) {
    return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
  }

  /**
   * Factor de valor presente de una anualidad: cuánto capital sostiene una
   * cuota de 1 durante `periods` periodos a la tasa `rate`.
   *
   * monto = cuota × factor    ·    cuota = monto ÷ factor
   *
   * @param {number} rate Tasa periódica en tanto por uno.
   * @param {number} periods Número de periodos.
   * @returns {number}
   */
  function annuityFactor(rate, periods) {
    return (1 - Math.pow(1 + rate, -periods)) / rate;
  }

  ORIGEN.core.math = { clamp, easeOut, monthlyRateFromAnnual, annuityFactor };
})(window.ORIGEN);
