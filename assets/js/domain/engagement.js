/**
 * ORIGEN · Ventana de conexión
 * ---------------------------------------------------------------------------
 * Construye la matriz de actividad digital del afiliado —7 días × 18 horas—
 * de la que se deduce cuándo tiene sentido contactarlo.
 *
 * El modelo es una campana gaussiana en dos dimensiones: una alrededor del día
 * de mayor actividad (circular, porque la semana da la vuelta) y otra alrededor
 * de la hora punta, más un suelo de actividad diurna para que ninguna franja
 * quede en cero. La matriz se normaliza para que el máximo sea 1.
 *
 * Es determinística y sin estado: no consume aleatoriedad. El día y la hora
 * punta se le pasan desde fuera.
 *
 * Dependencias: core/namespace.js, core/config.js, core/math.js
 */
(function (ORIGEN) {
  "use strict";

  const { clamp } = ORIGEN.core.math;

  /** Ancho de la campana del día, en días². Menor = actividad más concentrada. */
  const DAY_SPREAD = 2.6;
  /** Suelo de actividad constante. */
  const BASE_ACTIVITY = 0.05;
  /** Amplitud de la ondulación diurna sobre el suelo. */
  const DAYLIGHT_AMPLITUDE = 0.04;

  /**
   * @param {number} peakDay Día de mayor actividad, 0 = lunes.
   * @param {number} peakHour Hora de mayor actividad, en formato 24 h.
   * @param {number} hourSpread Desviación de la campana horaria, en horas.
   * @returns {number[][]} Matriz [día][hora] con valores normalizados en (0, 1].
   */
  function buildEngagementMatrix(peakDay, peakHour, hourSpread) {
    const { firstHour, lastHour } = ORIGEN.config.heatmap;
    const hourCount = lastHour - firstHour;
    const matrix = [];

    for (let day = 0; day < 7; day++) {
      const row = [];

      // Distancia circular al día punta: de domingo a lunes hay 1 día, no 6.
      const rawDistance = Math.abs(day - peakDay);
      const circularDistance = Math.min(rawDistance, 7 - rawDistance);
      const dayWeight = Math.exp(-Math.pow(circularDistance, 2) / DAY_SPREAD);

      for (let hour = firstHour; hour <= lastHour; hour++) {
        let value =
          Math.exp(-Math.pow(hour - peakHour, 2) / (2 * hourSpread * hourSpread)) * dayWeight;

        value +=
          BASE_ACTIVITY +
          DAYLIGHT_AMPLITUDE * Math.sin(((hour - firstHour) / hourCount) * Math.PI);

        row.push(clamp(value, 0.02, 1));
      }

      matrix.push(row);
    }

    const max = Math.max.apply(null, [].concat.apply([], matrix));
    return matrix.map(function (row) {
      return row.map(function (value) {
        return value / max;
      });
    });
  }

  /**
   * Localiza la celda de mayor actividad de la matriz.
   * @param {number[][]} matrix
   * @returns {{day: number, hour: number}} Día 0-6 y hora en formato 24 h.
   */
  function findPeak(matrix) {
    const { firstHour } = ORIGEN.config.heatmap;
    let peakDay = 0;
    let peakHour = 0;
    let best = -1;

    matrix.forEach(function (row, day) {
      row.forEach(function (value, hourIndex) {
        if (value > best) {
          best = value;
          peakDay = day;
          peakHour = hourIndex + firstHour;
        }
      });
    });

    return { day: peakDay, hour: peakHour };
  }

  /**
   * Etiqueta legible de la ventana de contacto: «Mar 19:00–21:00».
   * La ventana es de dos horas a partir de la hora punta.
   */
  function formatWindow(peak) {
    const day = ORIGEN.core.catalog.WEEKDAYS[peak.day];
    const from = String(peak.hour).padStart(2, "0");
    const to = String(peak.hour + 2).padStart(2, "0");
    return day + " " + from + ":00–" + to + ":00";
  }

  ORIGEN.domain.engagement = { buildEngagementMatrix, findPeak, formatWindow };
})(window.ORIGEN);
