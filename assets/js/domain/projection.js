/**
 * ORIGEN · Proyección de bienestar financiero a 12 meses
 * ---------------------------------------------------------------------------
 * Simula tres caminos posibles y devuelve la trayectoria mes a mes de un
 * índice de bienestar en escala 0–100:
 *
 *   now   · otorgar hoy          — el crédito se desembolsa ahora
 *   wait  · esperar el momento   — se libera capacidad primero
 *   route · no otorgar y acompañar — ruta de bienestar, sin desembolso
 *
 * El escenario con mejor valor a los 12 meses es el que gana, y ese es el
 * mecanismo por el que ORIGEN puede concluir que lo correcto es no prestar:
 * no es una excepción añadida a mano, es el resultado de comparar caminos.
 *
 * El índice es un constructo de la demostración, no una probabilidad de mora.
 * Está calibrado para ordenar escenarios entre sí, no para leerse en absoluto.
 *
 * Dependencias: core/namespace.js, core/config.js, core/math.js,
 *               domain/capacity.js
 */
(function (ORIGEN) {
  "use strict";

  const { clamp, easeOut } = ORIGEN.core.math;

  /** Horizonte de la proyección, en meses. */
  const HORIZON = 12;

  /** Mes en el que la curva «esperar» toca fondo antes de recuperarse. */
  const WAIT_TROUGH_MONTH = 5;

  /** Caída del bienestar durante la espera, en puntos del índice. */
  const WAIT_DIP = 2.2;

  /** Antigüedad por debajo de la cual un contrato no indefinido es inestable. */
  const UNSTABLE_TENURE_MONTHS = 10;

  /**
   * Valor del índice a los 12 meses en cada escenario.
   * Aquí vive toda la política de la proyección; el resto del archivo solo
   * interpola entre el punto de partida y estos destinos.
   */
  function computeEndpoints(a, product, headroom, blocked) {
    const stress = clamp(a.currentLoad, 0, 0.5);

    // Peso de la deuda externa costosa: crece con el saldo hasta $6M y se
    // atenúa al 60 % si la tasa no es alta.
    const externalBurden =
      a.externalDebt.count > 0
        ? clamp(a.externalDebt.balance / 6e6, 0, 1) * (a.externalDebt.annualRate >= 26 ? 1 : 0.6)
        : 0;

    const minTenure = ORIGEN.domain.capacity.requiredTenure(a);
    const unstable =
      (a.contractType !== "indefinido" && a.tenureMonths < UNSTABLE_TENURE_MONTHS) ||
      a.tenureMonths < minTenure;

    // Punto de partida: el bienestar de hoy.
    const start = clamp(56 + headroom * 20 - stress * 34 - externalBurden * 10, 10, 88);

    // --- Otorgar hoy ---
    let now = 57 + headroom * 24 - stress * 30 - (unstable ? 12 : 0);
    if (product === "cartera") {
      // La compra de cartera mejora el bienestar precisamente porque hay deuda
      // costosa que sustituir: cuanto más pesa, más ayuda ordenarla.
      now += 18 + externalBurden * 12;
    } else {
      // Cualquier otro producto se suma a la deuda existente.
      now -= externalBurden * 22;
    }
    if (a.isSelfEmployed) now -= 4;

    // --- Esperar ---
    // Con obligaciones por cerrar y poco margen, esperar libera capacidad y
    // vale la pena; con margen holgado, esperar solo aplaza el beneficio.
    let wait = now + (a.internalObligations >= 1 && headroom < 0.5 ? 14 : -7);
    if (product === "educativo" && a.lifeEvent !== "matricula") wait += 12;
    if (a.hasSeasonalNeed) wait += 6;

    // --- No otorgar y acompañar ---
    let route =
      34 + stress * 46 + (unstable ? 18 : 0) - headroom * 14 - (product === "cartera" ? 4 : 0);

    // Situación severa: prestar en cualquier forma empeora el pronóstico.
    const severe = blocked || a.currentLoad > ORIGEN.config.SEVERE_LOAD || a.tenureMonths < minTenure;
    if (severe) {
      now -= 22;
      wait -= 22;
    }

    now = clamp(now, 6, 96);
    wait = clamp(wait, 6, 96);
    route = clamp(route, 6, 96);

    // Si la política bloquea el desembolso, ningún escenario de otorgamiento
    // puede terminar por encima del acompañamiento: la ruta gana por
    // construcción, y el margen se mantiene visible en el gráfico.
    if (blocked) {
      now = clamp(Math.min(now, route - 10), 4, 96);
      wait = clamp(Math.min(wait, route - 5), 4, 96);
    }

    return { start, now, wait, route, unstable, minTenure };
  }

  /**
   * Trayectoria de «otorgar hoy»: sube hacia su destino, con un valle inicial
   * por el impacto de la primera cuota. El valle es menor en compra de cartera
   * porque sustituye una cuota que ya existía.
   */
  function nowSeries(start, end, product) {
    const dipDepth = product === "cartera" ? 3.5 : 9;
    const series = [];

    for (let month = 0; month <= HORIZON; month++) {
      const progress = month / HORIZON;
      // Valle centrado en el mes 1.6, cuando se siente la primera cuota.
      const dip = Math.exp(-Math.pow(month - 1.6, 2) / 3.2) * dipDepth;
      series.push(clamp(start + (end - start) * easeOut(progress) - dip, 4, 98));
    }

    return series;
  }

  /**
   * Trayectoria de «esperar»: cae levemente durante los primeros meses —el
   * afiliado sigue con su problema sin resolver— y a partir del mes 5 remonta
   * hacia su destino.
   */
  function waitSeries(start, end) {
    const series = [start];
    const trough = start - WAIT_DIP;

    for (let month = 1; month <= HORIZON; month++) {
      if (month < WAIT_TROUGH_MONTH) {
        series.push(clamp(start - WAIT_DIP * (month / WAIT_TROUGH_MONTH), 4, 98));
      } else {
        const progress = (month - WAIT_TROUGH_MONTH) / (HORIZON - WAIT_TROUGH_MONTH);
        series.push(clamp(trough + (end - trough) * easeOut(progress), 4, 98));
      }
    }

    return series;
  }

  /**
   * Trayectoria de «no otorgar y acompañar»: sin cuota nueva, la mejora es
   * gradual y sostenida, con una leve inercia inicial.
   */
  function routeSeries(start, end) {
    const series = [];

    for (let month = 0; month <= HORIZON; month++) {
      const progress = month / HORIZON;
      const inertia = 1.5 * Math.exp(-month / 2);
      series.push(clamp(start + (end - start) * easeOut(progress) * 0.94 - inertia, 4, 98));
    }

    return series;
  }

  /**
   * Proyecta los tres escenarios.
   *
   * @param {object} affiliate
   * @param {string} product Producto que se evaluaría en los escenarios de otorgamiento.
   * @param {number} headroom Espacio de cuota disponible, en tanto por uno.
   * @param {boolean} blocked true si la política impide el desembolso.
   * @returns {object} Series, valores finales y contexto de la proyección.
   */
  function project(affiliate, product, headroom, blocked) {
    const ends = computeEndpoints(affiliate, product, headroom, blocked);

    return {
      start: ends.start,
      now: nowSeries(ends.start, ends.now, product),
      wait: waitSeries(ends.start, ends.wait),
      route: routeSeries(ends.start, ends.route),
      endNow: ends.now,
      endWait: ends.wait,
      endRoute: ends.route,
      unstable: ends.unstable,
      minTenure: ends.minTenure,
    };
  }

  /**
   * Elige el escenario ganador: el de mayor bienestar a 12 meses.
   *
   * El desempate es explícito y en este orden: acompañar, esperar, otorgar.
   * Ante bienestar proyectado igual, ORIGEN prefiere la opción que no endeuda —
   * es una decisión de política, y estaba implícita en el código anterior.
   *
   * @returns {"route"|"wait"|"now"}
   */
  function winningScenario(projection) {
    const best = Math.max(projection.endNow, projection.endWait, projection.endRoute);
    if (projection.endRoute === best) return "route";
    if (projection.endWait === best) return "wait";
    return "now";
  }

  ORIGEN.domain.projection = { project, winningScenario, HORIZON };
})(window.ORIGEN);
