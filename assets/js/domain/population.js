/**
 * ORIGEN · Población sintética
 * ---------------------------------------------------------------------------
 * Genera los afiliados sobre los que opera la demostración. Sustituye a los
 * feeds reales de Colsubsidio sin que el resto del motor lo note: cualquier
 * fuente que produzca objetos con esta misma forma es intercambiable con esta
 * (ver docs/ARCHITECTURE.md §5, «reemplazo drop-in»).
 *
 * ⚠ ORDEN DE CONSUMO DE ALEATORIEDAD
 * ----------------------------------
 * `createSyntheticAffiliate` consume la fuente pseudoaleatoria en un orden
 * exacto. Añadir, quitar o mover una sola llamada desplaza toda la secuencia
 * posterior y cambia la población completa, rompiendo el criterio de
 * determinismo. Si necesitas una variable nueva, añádela AL FINAL de la
 * función, nunca en medio.
 *
 * Dependencias: core/namespace.js, core/config.js, core/math.js,
 *               core/random.js, domain/lifestage.js, domain/engagement.js
 */
(function (ORIGEN) {
  "use strict";

  const { clamp } = ORIGEN.core.math;

  /* --- Vocabulario de nombres --------------------------------------------
     Nombres frecuentes en Colombia, para que la población sintética resulte
     verosímil ante el jurado. No corresponden a personas reales. */

  const FEMALE_NAMES = ["María", "Laura", "Diana", "Andrea", "Paula", "Carolina", "Ángela", "Sara", "Natalia", "Claudia", "Marcela", "Daniela", "Lorena", "Sandra", "Viviana", "Camila"];
  const MALE_NAMES = ["Andrés", "Carlos", "Julián", "Camilo", "Jorge", "Diego", "Óscar", "Fabián", "Cristian", "Iván", "David", "Sebastián", "Mauricio", "Wilson", "Álvaro", "Nelson"];
  const SURNAMES = ["Gómez", "Rodríguez", "Martínez", "López", "Ramírez", "Torres", "Vargas", "Moreno", "Rojas", "Castro", "Ospina", "Quintero", "Cárdenas", "Salazar", "Peña", "Mora"];

  /** Modalidades contractuales, repetidas para ponderar su frecuencia real. */
  const CONTRACT_TYPES = ["indefinido", "indefinido", "indefinido", "fijo", "obra", "independiente", "independiente"];

  /** Temas de interés detectables; los nulos representan «sin señal». */
  const INTENT_TOPICS = ["hogar", "tecnologia", "vivienda", "educacion", "consolidacion", null, null];

  /** Marcas diacríticas Unicode, para quitar tildes tras normalizar en NFD. */
  const COMBINING_MARKS = /[\u0300-\u036f]/g;

  /**
   * Correo derivado del nombre, al estilo `nombre.apellido@…`.
   * Normaliza tildes y toma las dos primeras palabras.
   */
  function emailFromName(fullName) {
    const parts = fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .split(" ");
    return parts[0] + "." + parts[1] + "@gmail.com";
  }

  /**
   * Ingreso mensual según categoría de afiliación.
   * A ≤ 2 SMMLV · B 2–4 SMMLV · C > 4 SMMLV.
   * Consume: 1 valor aleatorio.
   */
  function incomeForCategory(category, random) {
    const { SMMLV } = ORIGEN.config;
    if (category === "A") return random.range(1.05, 2) * SMMLV;
    if (category === "B") return random.range(2, 4) * SMMLV;
    return random.range(4, 9.2) * SMMLV;
  }

  /**
   * Obligaciones con otras entidades.
   *
   * Es la inferencia que sustituye la consulta a Datacrédito: el motor no
   * consulta la central, deduce la carga externa del comportamiento de pago y
   * del perfil de gasto. Consume: 2 + n valores aleatorios.
   *
   * @returns {{count: number, balance: number, annualRate: number}}
   */
  function inferExternalDebt(random) {
    const count = random.rangeInt(1, 4);
    let balance = 0;
    for (let i = 0; i < count; i++) balance += random.range(1.4, 4) * 1e6;
    return {
      count,
      balance: Math.round(balance),
      annualRate: Math.round(random.range(22, 32)),
    };
  }

  /** Obligación externa inexistente. */
  function noExternalDebt() {
    return { count: 0, balance: 0, annualRate: 0 };
  }

  /**
   * Crea un afiliado sintético.
   * Ver la advertencia de orden de consumo en la cabecera del archivo.
   *
   * @param {object} random Fuente creada con ORIGEN.core.createRandom.
   * @returns {object} Perfil de afiliado.
   */
  function createSyntheticAffiliate(random) {
    const gender = random.chance(0.52) ? "F" : "M";

    // Distribución de categorías calibrada a la base real: A 45 %, B 38 %, C 17 %.
    const categoryRoll = random.next();
    const category = categoryRoll < 0.45 ? "A" : categoryRoll < 0.83 ? "B" : "C";

    const income = incomeForCategory(category, random);
    const age = random.rangeInt(21, 62);

    const contractType = random.pick(CONTRACT_TYPES);
    const isSelfEmployed = contractType === "independiente";

    // Un independiente no acumula antigüedad de nómina: su trayectoria es más corta.
    const tenureMonths = isSelfEmployed ? random.rangeInt(3, 40) : random.rangeInt(1, 120);

    const children = age < 25 ? random.rangeInt(0, 1) : random.rangeInt(0, 3);
    const schoolAgeChildren = children > 0 && age > 28 ? random.rangeInt(0, children) : 0;

    // Intensidad de uso del ecosistema Colsubsidio, normalizada en [0, 1].
    // El rango arranca en negativo para que una parte de la población quede
    // efectivamente en cero tras acotar.
    const networkUsage = clamp(random.range(-0.1, 1), 0, 1);

    // Actividad económica registrada: mucho más probable en independientes.
    const hasRuesActivity = isSelfEmployed ? random.chance(0.7) : random.chance(0.12);

    // Meses de ingresos no bancarizados con regularidad demostrable.
    const unbankedIncomeMonths = isSelfEmployed
      ? random.rangeInt(6, 26)
      : random.chance(0.12)
        ? random.rangeInt(6, 20)
        : 0;

    const topic = random.pick(INTENT_TOPICS);
    const intent = random.chance(0.42) ? topic : null;
    const intentIsRecent = intent ? random.chance(0.6) : false;

    // Evento de vida detectado: nacimiento 10 %, matrícula 9 %, vivienda 7 %.
    const eventRoll = random.next();
    let lifeEvent = null;
    if (eventRoll < 0.1) lifeEvent = "nacimiento";
    else if (eventRoll < 0.19) lifeEvent = "matricula";
    else if (eventRoll < 0.26) lifeEvent = "vivienda";

    const externalDebt = random.chance(0.36) ? inferExternalDebt(random) : noExternalDebt();
    const internalObligations = random.chance(0.2) ? random.rangeInt(1, 3) : 0;

    // Carga financiera actual como fracción del ingreso.
    let currentLoad = clamp(random.range(-0.08, 0.28), 0, 0.45);
    // Tres o más obligaciones externas implican una carga alta por definición.
    if (externalDebt.count >= 3) currentLoad = Math.max(currentLoad, random.range(0.2, 0.34));

    const hasSeasonalNeed = random.chance(0.09);

    const name =
      random.pick(gender === "F" ? FEMALE_NAMES : MALE_NAMES) +
      " " +
      random.pick(SURNAMES) +
      " " +
      random.pick(SURNAMES);

    const affiliate = {
      id: "CC " + random.rangeInt(20, 79) + "." + random.rangeInt(100, 999) + "." + random.rangeInt(100, 999),
      name,
      gender,
      category,
      income,
      age,
      contractType,
      isSelfEmployed,
      tenureMonths,
      children,
      schoolAgeChildren,
      networkUsage,
      hasRuesActivity,
      unbankedIncomeMonths,
      intent,
      intentIsRecent,
      lifeEvent,
      externalDebt,
      internalObligations,
      currentLoad,
      hasSeasonalNeed,
      email: emailFromName(name),
    };

    affiliate.lifeStage = ORIGEN.domain.inferLifeStage(affiliate);

    // Los mayores de 52 concentran menos su actividad digital: campana más ancha.
    affiliate.engagementMatrix = ORIGEN.domain.engagement.buildEngagementMatrix(
      random.pick([0, 1, 2, 3, 6]),
      random.pick([9, 12, 13, 18, 19, 20, 21]),
      age > 52 ? 2.4 : 1.8
    );

    return affiliate;
  }

  /* --- Perfiles de demostración -----------------------------------------
     Tres afiliados fijos, escritos a mano, que ejercitan tres caminos
     radicalmente distintos del motor. No consumen aleatoriedad: son literales,
     así que sobreviven a cualquier cambio en el generador y se pueden citar en
     el pitch con la certeza de que darán el mismo resultado.

       María   → compra de cartera (deuda externa costosa que se sustituye)
       Andrés  → cupo rotativo (independiente con ingresos no bancarizados)
       Carlos  → ruta de bienestar (carga excedida: no prestar es lo correcto)

     ⚠ Los nombres y edades no coinciden con los del documento maestro
       (María Rodríguez 38 / Ana Torres 29 / Carlos Gómez 45). Ver
       docs/MEJORAS.md §2.3. */

  function createMaria() {
    const affiliate = {
      id: "CC 52.114.883",
      name: "María Gómez Rojas",
      gender: "F",
      category: "B",
      income: 4000000,
      age: 38,
      contractType: "indefinido",
      isSelfEmployed: false,
      tenureMonths: 108,
      children: 2,
      schoolAgeChildren: 1,
      networkUsage: 0.8,
      hasRuesActivity: false,
      unbankedIncomeMonths: 0,
      intent: "hogar",
      intentIsRecent: false,
      lifeEvent: null,
      externalDebt: { count: 2, balance: 6400000, annualRate: 28 },
      internalObligations: 0,
      currentLoad: 0.34,
      hasSeasonalNeed: false,
      email: "maria.gomez@gmail.com",
      lifeStage: "formacion",
    };
    affiliate.engagementMatrix = ORIGEN.domain.engagement.buildEngagementMatrix(6, 19.5, 1.6);
    return affiliate;
  }

  function createAndres() {
    const affiliate = {
      id: "CC 1.020.774.551",
      name: "Andrés Torres Peña",
      gender: "M",
      category: "A",
      income: 2200000,
      age: 27,
      contractType: "independiente",
      isSelfEmployed: true,
      tenureMonths: 22,
      children: 0,
      schoolAgeChildren: 0,
      networkUsage: 0.45,
      hasRuesActivity: true,
      unbankedIncomeMonths: 22,
      intent: "tecnologia",
      intentIsRecent: true,
      lifeEvent: null,
      externalDebt: { count: 0, balance: 0, annualRate: 0 },
      internalObligations: 0,
      currentLoad: 0.12,
      hasSeasonalNeed: false,
      email: "andres.torres@gmail.com",
      lifeStage: "inicio",
    };
    affiliate.engagementMatrix = ORIGEN.domain.engagement.buildEngagementMatrix(1, 12.5, 1.5);
    return affiliate;
  }

  function createCarlos() {
    const affiliate = {
      id: "CC 1.007.559.310",
      name: "Carlos Ramírez Mora",
      gender: "M",
      category: "A",
      income: 2000000,
      age: 26,
      contractType: "obra",
      isSelfEmployed: false,
      tenureMonths: 6,
      children: 0,
      schoolAgeChildren: 0,
      networkUsage: 0.3,
      hasRuesActivity: false,
      unbankedIncomeMonths: 0,
      intent: "consolidacion",
      intentIsRecent: false,
      lifeEvent: null,
      externalDebt: { count: 4, balance: 9000000, annualRate: 30 },
      internalObligations: 1,
      currentLoad: 0.48,
      hasSeasonalNeed: false,
      email: "carlos.ramirez@gmail.com",
      lifeStage: "inicio",
    };
    affiliate.engagementMatrix = ORIGEN.domain.engagement.buildEngagementMatrix(3, 21, 1.8);
    return affiliate;
  }

  /**
   * Construye la población completa: los tres perfiles demo al frente, para
   * que el jurado los encuentre en la primera pantalla, seguidos de los
   * sintéticos.
   *
   * @param {number} [seed] Semilla; por defecto la de configuración.
   * @returns {object[]}
   */
  function buildPopulation(seed) {
    const random = ORIGEN.core.createRandom(seed);
    const population = [createMaria(), createAndres(), createCarlos()];

    for (let i = 0; i < ORIGEN.config.SYNTHETIC_POPULATION; i++) {
      population.push(createSyntheticAffiliate(random));
    }

    return population;
  }

  ORIGEN.domain.population = {
    buildPopulation,
    createSyntheticAffiliate,
    createMaria,
    createAndres,
    createCarlos,
  };
})(window.ORIGEN);
