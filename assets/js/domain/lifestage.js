/**
 * ORIGEN · Momento de vida
 * ---------------------------------------------------------------------------
 * Infiere en qué etapa vital está el afiliado a partir de su trayectoria, y
 * lo hace ANTES de mirar producto. Es deliberado: la etapa fija la cuota y el
 * plazo prudentes, de modo que la restricción de bienestar se aplica antes de
 * cualquier consideración comercial.
 *
 * Las reglas se evalúan en orden y la primera que coincide gana. El orden es
 * la política: un evento de vivienda pesa más que la edad, y la edad más que
 * la composición del hogar.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  /**
   * @param {object} affiliate Perfil con edad, antigüedad, hijos, evento e intención.
   * @returns {string} Clave de ORIGEN.core.catalog.LIFE_STAGES.
   */
  function inferLifeStage(affiliate) {
    // Un evento o una intención de vivienda define la etapa por sí solo: lo
    // que cambia es si la persona está formando hogar o consolidando.
    if (affiliate.lifeEvent === "vivienda" || affiliate.intent === "vivienda") {
      return affiliate.age < 40 ? "formacion" : "consolidacion";
    }

    // Inicio laboral: muy joven, o con poca trayectoria y sin hijos.
    if (affiliate.age < 26 || (affiliate.tenureMonths < 18 && affiliate.children === 0)) {
      return "inicio";
    }

    // Hijos en edad escolar antes de los 48 = crianza y expansión.
    if (affiliate.schoolAgeChildren > 0 && affiliate.age < 48) return "crianza";

    if (affiliate.age >= 57) return "madurez";
    if (affiliate.age >= 40) return "consolidacion";
    if (affiliate.age <= 38 && affiliate.children <= 1) return "formacion";

    return "crianza";
  }

  ORIGEN.domain.inferLifeStage = inferLifeStage;
})(window.ORIGEN);
