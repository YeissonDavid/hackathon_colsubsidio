/**
 * ORIGEN · Configuración
 * ---------------------------------------------------------------------------
 * Todo parámetro de negocio vive aquí y en ningún otro sitio. Si un número
 * aparece en la lógica sin pasar por este archivo, es un defecto.
 *
 * Motivo: los topes de endeudamiento, el SMMLV y las tasas son decisiones de
 * riesgo y de política, no de programación. Deben poder revisarse y calibrarse
 * sin abrir el motor — y ser auditables de un vistazo.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  ORIGEN.config = {
    /**
     * Semilla del generador pseudoaleatorio.
     *
     * De esto depende el criterio de aceptación de determinismo: la misma
     * semilla produce siempre la misma población y, por tanto, las mismas
     * resoluciones. Cambiarla cambia toda la demostración.
     */
    SEED: 20260726,

    /**
     * Salario mínimo mensual legal vigente usado como unidad de referencia
     * para las categorías de afiliación (A ≤ 2 SMMLV · B 2–4 · C > 4).
     *
     * PENDIENTE DE CALIBRAR: valor de demostración. Debe fijarse al SMMLV
     * decretado para el año en curso antes de cualquier uso real.
     */
    SMMLV: 1500000,

    /** Número de afiliados sintéticos generados además de los 3 perfiles demo. */
    SYNTHETIC_POPULATION: 217,

    /** Filas visibles en la bandeja antes de paginar. */
    INBOX_PAGE_SIZE: 60,

    /**
     * Vinculación mínima con la Caja para ser elegible, en meses.
     * Regla oficial: 2 meses con contrato a término indefinido, 6 en cualquier
     * otra modalidad contractual.
     */
    tenure: {
      indefinido: 2,
      otros: 6,
    },

    /**
     * Tope de capacidad por libranza.
     * Regla oficial: 1 SMMLV de ingreso habilita hasta $1.500.000; el tope
     * crece con el ingreso pero nunca supera 3 veces el ingreso mensual.
     */
    libranza: {
      perSmmlv: 1500000,
      maxIncomeMultiple: 3,
    },

    /**
     * Umbral de carga a partir del cual la situación se considera severa y la
     * proyección penaliza los escenarios de otorgamiento.
     */
    SEVERE_LOAD: 0.44,

    /** Rango en el que se acota la confianza declarada del motor. */
    confidence: {
      base: 0.62,
      scoreBonusCap: 0.22,
      scoreDivisor: 300,
      penaltyIndependiente: 0.08,
      penaltyShortTenure: 0.07,
      bonusUnbanked: 0.05,
      maxWhenNotViable: 0.7,
      min: 0.45,
      max: 0.95,
    },

    /** Horas cubiertas por el mapa de calor de conexión (6:00 a 23:00). */
    heatmap: {
      firstHour: 6,
      lastHour: 23,
    },
  };
})(window.ORIGEN);
