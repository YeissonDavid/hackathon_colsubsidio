/**
 * ORIGEN · Motor avanzado — valores derivados de la cédula
 * ---------------------------------------------------------------------------
 * El motor avanzado no recorre una población pregenerada: recibe UNA cédula y
 * deriva su perfil completo con un hash. Eso cambia la propiedad de
 * determinismo, y para mejor:
 *
 *   · Motor base    → semilla + orden de llamadas. Reproducible, pero frágil:
 *                     tocar el generador desplaza toda la población.
 *   · Motor avanzado → hash(cédula, atributo). Cada valor es independiente de
 *                     los demás. La cédula 10000053 devuelve siempre lo mismo,
 *                     sin importar qué más se calcule ni en qué orden.
 *
 * Consecuencia práctica: se puede añadir un atributo nuevo sin alterar ninguno
 * de los existentes. El jurado puede escribir cualquier cédula y obtener un
 * perfil estable, hoy y mañana.
 *
 * FNV-1a de 32 bits. No es criptográfico y no pretende serlo: solo necesita
 * distribuir bien y ser idéntico en todos los navegadores.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  /** Constantes de FNV-1a de 32 bits. */
  const FNV_OFFSET_BASIS = 2166136261;
  const FNV_PRIME = 16777619;
  const UINT32_MAX = 4294967295;

  /**
   * Hash de una cédula combinada con un nombre de atributo.
   * @param {string|number} id Cédula.
   * @param {string} attribute Nombre del atributo, la «sal».
   * @returns {number} Entero sin signo de 32 bits.
   */
  function hash(id, attribute) {
    const text = String(id) + "|" + attribute;
    let value = FNV_OFFSET_BASIS >>> 0;

    for (let i = 0; i < text.length; i++) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, FNV_PRIME) >>> 0;
    }

    return value >>> 0;
  }

  /** Valor estable en [0, 1] para una cédula y un atributo. */
  function unit(id, attribute) {
    return hash(id, attribute) / UINT32_MAX;
  }

  /** Entero estable en [min, max], ambos inclusive. */
  function integer(id, attribute, min, max) {
    return min + Math.floor(unit(id, attribute) * (max - min + 1));
  }

  ORIGEN.domain.advanced = ORIGEN.domain.advanced || {};
  ORIGEN.domain.advanced.derive = { hash, unit, integer };
})(window.ORIGEN);
