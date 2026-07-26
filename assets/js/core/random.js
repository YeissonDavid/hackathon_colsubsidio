/**
 * ORIGEN · Aleatoriedad sembrada
 * ---------------------------------------------------------------------------
 * Generador pseudoaleatorio determinístico (mulberry32). Es la pieza que hace
 * cumplible el criterio de aceptación de reproducibilidad: con la misma
 * semilla, la misma secuencia de llamadas produce siempre los mismos valores.
 *
 * ADVERTENCIA PARA QUIEN MODIFIQUE EL GENERADOR DE POBLACIÓN
 * ----------------------------------------------------------
 * El resultado depende del ORDEN de consumo, no solo de la semilla. Añadir,
 * quitar o reordenar una llamada a `next`, `range`, `rangeInt`, `pick` o
 * `chance` desplaza toda la secuencia posterior y cambia la población entera.
 * Si eso ocurre, los perfiles demo siguen intactos (son literales) pero los
 * 217 sintéticos cambian y las pruebas de determinismo fallarán.
 *
 * Dependencias: core/namespace.js, core/config.js
 */
(function (ORIGEN) {
  "use strict";

  /**
   * mulberry32: generador de 32 bits, rápido y de calidad suficiente para
   * simulación (no criptográfico).
   * @param {number} seed
   * @returns {() => number} Función que devuelve un flotante en [0, 1).
   */
  function mulberry32(seed) {
    let state = seed | 0;
    return function next() {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Crea una fuente de aleatoriedad independiente.
   * Se expone como fábrica —y no como singleton— para que las pruebas puedan
   * instanciar secuencias limpias sin contaminar la de la aplicación.
   *
   * @param {number} [seed] Semilla; por defecto la de configuración.
   */
  function createRandom(seed) {
    const next = mulberry32(seed === undefined ? ORIGEN.config.SEED : seed);

    return {
      /** Flotante en [0, 1). */
      next,

      /** Flotante en [min, max). */
      range(min, max) {
        return min + (max - min) * next();
      },

      /** Entero en [min, max], ambos inclusive. */
      rangeInt(min, max) {
        return Math.floor(min + (max + 1 - min) * next());
      },

      /** Un elemento cualquiera del arreglo. */
      pick(items) {
        return items[Math.floor(next() * items.length)];
      },

      /** true con probabilidad `p`. */
      chance(p) {
        return next() < p;
      },
    };
  }

  ORIGEN.core.createRandom = createRandom;
})(window.ORIGEN);
