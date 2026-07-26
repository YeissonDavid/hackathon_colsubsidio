/**
 * ORIGEN · Scorer aditivo (caja de cristal)
 * ---------------------------------------------------------------------------
 * Puntúa las siete líneas del portafolio y devuelve, además del ganador, la
 * descomposición del puntaje señal por señal.
 *
 * Por qué aditivo y no un modelo entrenado: el requisito no negociable del
 * reto es poder explicar por qué se recomendó un producto. Un puntaje que es
 * literalmente una suma de aportes nombrados se puede auditar sumando a mano,
 * y ante la Superintendencia Financiera eso es defendible; un modelo
 * estocástico no lo es.
 *
 * Cada regla es una línea legible: producto, señal, puntos. La tabla de reglas
 * ES la política — no hay pesos escondidos en ninguna otra parte.
 *
 * Dependencias: core/namespace.js, core/catalog.js
 */
(function (ORIGEN) {
  "use strict";

  /**
   * Aplica las reglas de puntuación a un afiliado.
   *
   * @param {object} a Perfil del afiliado.
   * @returns {{best: string, totals: object}} Producto ganador y totales por
   *          producto, cada uno con `sum` y `parts` (aportes por señal).
   */
  function scoreProducts(a) {
    const contributions = [];

    /** Registra un aporte. Los aportes nulos o negativos se descartan. */
    function add(product, signal, points) {
      if (points > 0) {
        contributions.push({ product, signal, points: Math.round(points) });
      }
    }

    const stage = a.lifeStage;

    /* --- Cupo rotativo: liquidez del día a día -------------------------- */
    add("cupo", "Uso frecuente de la red", a.networkUsage * 30);
    if (a.intent === "hogar" || a.intent === "tecnologia") {
      add("cupo", "Intención de compra", 22);
    }
    if (a.unbankedIncomeMonths > 0) {
      // Se satura a los 24 meses: más historial no añade más señal.
      add("cupo", "Ingresos no bancarizados", (Math.min(a.unbankedIncomeMonths, 24) / 24) * 26);
    }
    if (stage === "inicio") add("cupo", "Etapa de inicio", 16);
    add("cupo", "Necesidad puntual", 6);
    if (a.hasRuesActivity) add("cupo", "Actividad RUES", 8);

    /* --- Crédito de consumo: ordenar deuda costosa ----------------------- */
    if (a.externalDebt.count >= 2) {
      // Aporte fuerte y creciente con el saldo, con premio si la tasa es alta.
      add(
        "consumo",
        "Obligaciones externas costosas",
        44 + Math.min(a.externalDebt.balance / 1e6, 10) * 2 + (a.externalDebt.annualRate >= 27 ? 8 : 0)
      );
    }
    if (a.intent === "consolidacion") add("consumo", "Intención de consolidar", 18);
    if (a.externalDebt.count === 1 && a.externalDebt.annualRate >= 27) {
      add("consumo", "Obligaciones externas costosas", 24);
    }

    /* --- Crédito de vivienda: construir patrimonio --------------------- */
    if (a.lifeEvent === "vivienda") add("vivienda", "Evento de vivienda", 40);
    if (a.intent === "vivienda" && a.intentIsRecent) {
      add("vivienda", "Evento de vivienda", 22);
    }
    if (stage === "formacion") add("vivienda", "Capacidad por categoría", 18);
    add("vivienda", "Capacidad por categoría", a.category === "C" ? 15 : a.category === "B" ? 8 : 2);
    if (a.tenureMonths > 36) add("vivienda", "Estabilidad sostenida", 11);

    /* --- Educativo: formación del hogar -------------------------------- */
    if (a.schoolAgeChildren > 0) add("educativo", "Hijos en edad escolar", 30);
    if (a.intent === "educacion") add("educativo", "Intención formativa", 24);
    if (a.lifeEvent === "matricula") add("educativo", "Matrícula próxima", 26);

    /* --- Crédito de mujeres: acompañamiento con protección ------------- */
    if (a.gender === "F") {
      add("mujeres", "Perfil de cuidado", a.children > 0 ? 20 : 8);
      if (a.intent === "hogar") add("mujeres", "Mejora del hogar", 16);
      if (stage === "formacion" || stage === "crianza") add("mujeres", "Perfil de cuidado", 12);
      add("mujeres", "Necesidad puntual", 6);
    }

    // Las líneas «Rotativo seguros e impuestos» y «Crédito complementario»
    // salieron del catálogo base. La estacionalidad que activaba el rotativo
    // se evalúa ahora en el motor avanzado (domain/advanced/deliberation.js).

    return aggregate(contributions);
  }

  /**
   * Agrupa los aportes por producto y fusiona los que comparten señal, para
   * que la señal aparezca una sola vez en la explicación con su peso total.
   */
  function aggregate(contributions) {
    const totals = {};

    contributions.forEach(function (c) {
      if (!totals[c.product]) totals[c.product] = { sum: 0, parts: [] };
      const entry = totals[c.product];
      entry.sum += c.points;

      const existing = entry.parts.find(function (p) {
        return p.signal === c.signal;
      });
      if (existing) existing.points += c.points;
      else entry.parts.push({ signal: c.signal, points: c.points });
    });

    let best = null;
    for (const product in totals) {
      if (!best || totals[product].sum > totals[best].sum) best = product;
    }

    return { best, totals };
  }

  /**
   * Ordena el portafolio completo de mayor a menor puntaje, incluidos los
   * productos con cero, y ordena los aportes dentro de cada producto.
   *
   * Mostrar también los que perdieron es parte de la explicabilidad: el
   * analista ve el ranking íntegro, no solo la conclusión.
   *
   * @returns {{product: string, sum: number, parts: object[]}[]}
   */
  function rankPortfolio(totals) {
    return ORIGEN.core.catalog.PRODUCT_ORDER.map(function (product) {
      const entry = totals[product];
      return {
        product,
        sum: entry ? entry.sum : 0,
        parts: entry
          ? entry.parts.slice().sort(function (x, y) {
              return y.points - x.points;
            })
          : [],
      };
    }).sort(function (x, y) {
      return y.sum - x.sum;
    });
  }

  ORIGEN.domain.scoring = { scoreProducts, rankPortfolio };
})(window.ORIGEN);
