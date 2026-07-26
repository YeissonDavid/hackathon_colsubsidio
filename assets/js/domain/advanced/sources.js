/**
 * ORIGEN · Motor avanzado — fuentes exógenas
 * ---------------------------------------------------------------------------
 * Las cinco fuentes que el motor consulta, cada una con su base jurídica.
 *
 * Son conmutables una por una, y eso es el argumento central del simulador: al
 * apagar una fuente se ve en directo cómo cambia la decisión. Demuestra que el
 * enriquecimiento no es decorativo — y el Laboratorio lo cuantifica midiendo
 * cuánto empeora la cartera sin cada fuente.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  const SOURCES = [
    {
      key: "bureau",
      name: "Centrales de información crediticia",
      provides: "Obligaciones vigentes con otras entidades: número, saldo y tasa",
      legalBasis: "Autorización expresa del titular",
    },
    {
      key: "alt",
      name: "Data alternativa de ingresos",
      provides: "Pagos de servicios, telecomunicaciones y pasarelas de recaudo",
      legalBasis: "Autorización expresa",
    },
    {
      key: "pub",
      name: "Registros públicos",
      provides: "Actividad económica registrada (cámaras de comercio, RUES)",
      legalBasis: "Dato de naturaleza pública",
    },
    {
      key: "dig",
      name: "Canales digitales propios",
      provides: "Navegación, búsquedas y simulaciones en Colsubsidio",
      legalBasis: "Relación de afiliación",
    },
    {
      key: "cont",
      name: "Contactabilidad verificada",
      provides: "Correo, celular y canal de preferencia",
      legalBasis: "Consentimiento de canal",
    },
  ];

  /** Todas las fuentes activas. Devuelve un objeto nuevo en cada llamada. */
  function allEnabled() {
    const state = {};
    SOURCES.forEach(function (source) {
      state[source.key] = true;
    });
    return state;
  }

  /**
   * SMMLV del motor avanzado.
   *
   * ⚠ NO coincide con ORIGEN.config.SMMLV (1.500.000) que usa el motor base.
   * Los dos motores llegaron por caminos distintos y quedaron desalineados.
   * Ver docs/MEJORAS.md §4.1: hay que unificarlos contra el decreto vigente.
   */
  const SMMLV = 1423500;

  ORIGEN.domain.advanced = ORIGEN.domain.advanced || {};
  ORIGEN.domain.advanced.sources = { SOURCES, allEnabled, SMMLV };
})(window.ORIGEN);
