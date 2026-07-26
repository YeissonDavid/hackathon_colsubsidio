/**
 * ORIGEN · Gráficos
 * ---------------------------------------------------------------------------
 * SVG generado a mano, sin librerías de terceros. Dos motivos: la solución
 * debe arrancar con doble clic y sin instalar nada, y una dependencia de CDN
 * es un punto de fallo justo en el momento de la demostración.
 *
 * El color NUNCA se escribe aquí. Cada elemento recibe la clase del escenario
 * (`scenario--now`, `scenario--wait`, `scenario--route`) y la hoja de estilo
 * decide el trazo. Además de mantener una sola fuente de verdad para la
 * paleta, evita `stroke="var(--x)"`: `var()` dentro de un atributo de
 * presentación SVG no es fiable en todos los navegadores, y si falla el trazo
 * se dibuja en negro.
 *
 * Dependencias: core/namespace.js, core/catalog.js, domain/{projection,
 *               narrative}.js
 */
(function (ORIGEN) {
  "use strict";

  /* --- Geometría del gráfico de proyección ------------------------------ */
  const WIDTH = 760;
  const HEIGHT = 250;
  const PAD_LEFT = 42;
  const PAD_RIGHT = 58;   /* espacio para las etiquetas de fin de serie */
  const PAD_TOP = 16;
  const PAD_BOTTOM = 28;

  const INNER_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
  const INNER_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;

  /** Marcas del eje vertical (índice de bienestar 0–100). */
  const Y_TICKS = [0, 25, 50, 75, 100];
  /** Marcas del eje horizontal, en meses. */
  const X_TICKS = [0, 3, 6, 9, 12];

  const SCENARIOS = [
    { key: "now", label: "Otorgar ahora" },
    { key: "wait", label: "Esperar mejor momento" },
    { key: "route", label: "No otorgar · acompañar" },
  ];

  /** Mes → coordenada X. */
  function scaleX(month) {
    return PAD_LEFT + (month / ORIGEN.domain.projection.HORIZON) * INNER_WIDTH;
  }

  /** Índice de bienestar → coordenada Y. */
  function scaleY(value) {
    return PAD_TOP + INNER_HEIGHT - (value / 100) * INNER_HEIGHT;
  }

  /** Serie de valores → atributo `d` de un path. */
  function toPath(values) {
    return values
      .map(function (value, month) {
        return (month ? "L" : "M") + scaleX(month).toFixed(1) + "," + scaleY(value).toFixed(1);
      })
      .join(" ");
  }

  /**
   * Gráfico de proyección de bienestar a 12 meses, con los tres escenarios,
   * su leyenda y la lectura en lenguaje natural.
   *
   * @param {object} decision Registro de decisión.
   * @returns {string} HTML.
   */
  function projectionChart(decision) {
    const p = decision.projection;

    const series = SCENARIOS.map(function (scenario) {
      return {
        key: scenario.key,
        label: scenario.label,
        values: p[scenario.key],
        end: scenario.key === "now" ? p.endNow : scenario.key === "wait" ? p.endWait : p.endRoute,
        isWinner: decision.winningScenario === scenario.key,
      };
    });

    const grid = Y_TICKS.map(function (value) {
      return (
        '<line x1="' + PAD_LEFT + '" y1="' + scaleY(value) +
        '" x2="' + (PAD_LEFT + INNER_WIDTH) + '" y2="' + scaleY(value) + '"/>'
      );
    }).join("");

    const yLabels = Y_TICKS.map(function (value) {
      return (
        '<text x="' + (PAD_LEFT - 9) + '" y="' + (scaleY(value) + 3.5) +
        '" text-anchor="end">' + value + "</text>"
      );
    }).join("");

    const xLabels = X_TICKS.map(function (month) {
      return (
        '<text x="' + scaleX(month) + '" y="' + (PAD_TOP + INNER_HEIGHT + 18) +
        '" text-anchor="middle">' + (month === 0 ? "hoy" : "mes " + month) + "</text>"
      );
    }).join("");

    let paths = "";
    let endpoints = "";

    series.forEach(function (s) {
      const scenarioClass = "scenario--" + s.key;
      const muted = s.isWinner ? "" : " serie--muted";

      paths += '<path class="serie ' + scenarioClass + muted + '" d="' + toPath(s.values) + '"/>';

      endpoints +=
        '<circle class="endpoint ' + scenarioClass + (s.isWinner ? "" : " endpoint--muted") +
        '" cx="' + scaleX(ORIGEN.domain.projection.HORIZON) + '" cy="' + scaleY(s.end) +
        '" r="' + (s.isWinner ? 4 : 3) + '"/>';

      endpoints +=
        '<text class="endlbl ' + scenarioClass + (s.isWinner ? "" : " endlbl--muted") +
        '" x="' + (scaleX(ORIGEN.domain.projection.HORIZON) + 9) + '" y="' + (scaleY(s.end) + 4) +
        '">' + Math.round(s.end) + "</text>";
    });

    const legend = series
      .map(function (s) {
        return (
          '<div class="clg' + (s.isWinner ? " clg--winner" : "") + '">' +
          '<span class="clg__line clg__line--' + s.key + '"></span>' +
          '<span class="clg__label">' + s.label + "</span>" +
          '<span class="clg__value">' + Math.round(s.values[0]) + " → " + Math.round(s.end) + "</span>" +
          "</div>"
        );
      })
      .join("");

    // Ventaja del escenario ganador sobre la mejor de las alternativas.
    const winner = series.find(function (s) {
      return s.isWinner;
    });
    const others = series
      .filter(function (s) {
        return !s.isWinner;
      })
      .map(function (s) {
        return Math.round(s.end);
      });
    const margin = Math.round(winner.end) - Math.max.apply(null, others);

    const readout = ORIGEN.domain.narrative.explainProjection({
      winner: decision.winningScenario,
      margin,
      isSequenced: decision.isSequenced,
    });

    return (
      '<div class="chart">' +
      '<svg viewBox="0 0 ' + WIDTH + " " + HEIGHT +
      '" role="img" aria-label="Proyección de bienestar financiero a doce meses. ' +
      'Escenario recomendado: ' + winner.label + ', ' + Math.round(winner.end) +
      ' puntos frente a ' + others.join(" y ") + '.">' +
      '<g class="grid">' + grid + "</g>" +
      '<line class="todayline" x1="' + scaleX(0) + '" y1="' + PAD_TOP +
      '" x2="' + scaleX(0) + '" y2="' + (PAD_TOP + INNER_HEIGHT) + '"/>' +
      '<g class="axis">' + yLabels + xLabels +
      '<text class="axis-caption" x="' + (PAD_LEFT - 9) + '" y="' + (PAD_TOP - 4) +
      '" text-anchor="end">índice</text>' +
      "</g>" +
      paths + endpoints +
      "</svg>" +
      "</div>" +
      '<div class="chartlegend">' + legend + "</div>" +
      '<div class="readout">' + readout + "</div>"
    );
  }

  /* --- Mapa de calor de conexión ---------------------------------------- */

  /** Opacidad mínima de una celda, para que ninguna quede invisible. */
  const HEAT_FLOOR = 0.06;
  /** Recorrido de opacidad por encima del suelo. */
  const HEAT_RANGE = 0.9;

  /** Intensidad normalizada → color de celda. */
  function heatColor(intensity) {
    const alpha = (HEAT_FLOOR + intensity * HEAT_RANGE).toFixed(2);
    return "rgba(var(--brand-amarillo-rgb), " + alpha + ")";
  }

  /**
   * Mapa de calor de actividad digital: 7 días × 18 horas, con la ventana
   * recomendada resaltada.
   *
   * @param {object} decision
   * @returns {string} HTML.
   */
  function engagementHeatmap(decision) {
    const { WEEKDAYS } = ORIGEN.core.catalog;
    const { firstHour, lastHour } = ORIGEN.config.heatmap;

    let cells = "<div></div>"; /* esquina vacía sobre la columna de días */

    for (let hour = firstHour; hour <= lastHour; hour++) {
      // Se rotula cada tres horas para no saturar el eje.
      cells += '<div class="heat__hour">' + (hour % 3 === 0 ? hour : "") + "</div>";
    }

    decision.affiliate.engagementMatrix.forEach(function (row, dayIndex) {
      cells += '<div class="heat__day">' + WEEKDAYS[dayIndex] + "</div>";

      row.forEach(function (intensity, hourIndex) {
        const hour = hourIndex + firstHour;
        const isPeak =
          dayIndex === decision.peakDay && hour >= decision.peakHour && hour < decision.peakHour + 2;

        cells +=
          '<div class="heat__cell' + (isPeak ? " heat__cell--peak" : "") +
          '" style="background:' + heatColor(intensity) + '"' +
          ' title="' + WEEKDAYS[dayIndex] + " " + hour + ':00"></div>';
      });
    });

    const scale = [0.1, 0.3, 0.55, 0.8, 1]
      .map(function (intensity) {
        return '<span class="heatscale__step" style="background:' + heatColor(intensity) + '"></span>';
      })
      .join("");

    return (
      '<div class="heat" role="img" aria-label="Actividad digital por día y hora. ' +
      'Ventana de mayor conexión: ' + decision.contactWindowLabel + '.">' + cells + "</div>" +
      '<div class="heatfoot">' +
      "<div>Ventana de mayor conexión: <strong>" + decision.contactWindowLabel + "</strong></div>" +
      '<div class="heatscale"><span>baja</span>' + scale + "<span>alta</span></div>" +
      "</div>"
    );
  }

  ORIGEN.ui.charts = { projectionChart, engagementHeatmap };
})(window.ORIGEN);
