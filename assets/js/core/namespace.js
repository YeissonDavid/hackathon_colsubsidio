/**
 * ORIGEN · Espacio de nombres raíz
 * ---------------------------------------------------------------------------
 * Este proyecto se ejecuta abriendo `index.html` con doble clic (protocolo
 * `file://`), y en ese protocolo los navegadores bloquean los módulos ES
 * (`<script type="module">`) por política de origen cruzado. Por eso los
 * archivos se cargan como scripts clásicos en orden de dependencia y cada uno
 * se envuelve en una IIFE que publica su API en este único objeto global.
 *
 * El resultado es equivalente a módulos: un solo símbolo global, sin fugas de
 * variables internas, con dependencias declaradas al inicio de cada archivo.
 * La migración a ES Modules es mecánica — ver docs/ARCHITECTURE.md §6.
 *
 * Dependencias: ninguna. Este archivo debe cargarse primero.
 */
window.ORIGEN = window.ORIGEN || {
  /** Constantes de negocio y parámetros de política. */
  config: {},
  /** Utilidades puras: números, aleatoriedad sembrada, formato, catálogo. */
  core: {},
  /** Lógica de dominio: perfilamiento, scoring, capacidad, proyección. */
  domain: {},
  /** Capa de presentación: DOM, vistas, gráficos. */
  ui: {},
};
