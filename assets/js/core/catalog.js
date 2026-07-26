/**
 * ORIGEN · Catálogo del portafolio y vocabulario del dominio
 * ---------------------------------------------------------------------------
 * Las siete líneas de crédito, los cinco momentos de vida y las señales que
 * el motor sabe nombrar. Es el diccionario compartido entre el motor y la
 * interfaz: si un producto o una señal no está aquí, no existe para ORIGEN.
 *
 * NOTA DE CONSISTENCIA DOCUMENTAL
 * -------------------------------
 * Este catálogo reproduce el del documento maestro (7 líneas, con «Crédito
 * Mujer» como línea propia). El registro de avance del 23-jul-2026 describe un
 * catálogo posterior distinto —«Consumo general» absorbiendo Crédito Mujer, y
 * «Libre Inversión» como línea propia—. Los dos documentos no coinciden y la
 * decisión sigue abierta; ver docs/MEJORAS.md §2.1.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  /**
   * Momentos de vida. Cada uno fija la cuota máxima tolerable como fracción
   * del ingreso y el plazo máximo prudente en meses, ANTES de mirar producto.
   *
   * PENDIENTE DE CALIBRAR: estos topes son supuestos de la demostración.
   * Deben alinearse con la matriz de riesgo vigente de Colsubsidio.
   */
  const LIFE_STAGES = {
    inicio: { name: "Inicio laboral", maxInstallmentRatio: 0.22, maxTermMonths: 24 },
    formacion: { name: "Formación de hogar", maxInstallmentRatio: 0.3, maxTermMonths: 180 },
    crianza: { name: "Crianza y expansión", maxInstallmentRatio: 0.25, maxTermMonths: 60 },
    consolidacion: { name: "Consolidación", maxInstallmentRatio: 0.32, maxTermMonths: 120 },
    madurez: { name: "Madurez y protección", maxInstallmentRatio: 0.25, maxTermMonths: 36 },
  };

  /**
   * Líneas del portafolio.
   *
   * `monthlyRate` es la tasa mensual en tanto por uno con la que se convierte
   * capacidad de pago en monto. `terms` recoge las condiciones comerciales de
   * cada línea, extraídas de la lógica de decisión para que dejen de estar
   * dispersas en una cadena de `else if`:
   *
   *   termMonths  plazo con el que se calcula la cuota
   *   target      monto objetivo si la capacidad lo permite; puede ser función
   *               del afiliado cuando el tope depende de su perfil
   *   minViable   por debajo de este monto la operación no se propone
   *   note        condición que se muestra al analista en la resolución
   */
  const PRODUCTS = {
    cupo: {
      name: "Cupo rotativo",
      monthlyRate: 0.022,
      terms: {
        termMonths: 24,
        target: function () { return 5e6; },
        minViable: 150000,
        note: "Escalable por cumplimiento",
      },
    },
    cartera: {
      name: "Compra de cartera",
      monthlyRate: 0.015,
      terms: {
        termMonths: 48,
        // Sustituye la deuda externa; si no se conoce el saldo, se aproxima
        // por el compromiso mensual anualizado a medio año.
        target: function (a, ctx) {
          return Math.max(2e6, a.externalDebt.balance || ctx.committed * 6);
        },
        minViable: 1e6,
        note: "Unifica a menor tasa",
      },
    },
    hipotecario: {
      name: "Crédito hipotecario",
      monthlyRate: 0.009,
      terms: {
        termMonths: 180,
        target: function (a) { return Math.min(2.5e8, a.income * 30); },
        minViable: 2e7,
        note: "UVR o pesos",
      },
    },
    educativo: {
      name: "Crédito educativo",
      monthlyRate: 0.012,
      terms: {
        termMonths: 48,
        target: function (a) {
          return a.category === "C" ? 12e6 : a.category === "B" ? 6e6 : 3e6;
        },
        minViable: 1e6,
        note: "Institución acreditada",
      },
    },
    mujer: {
      name: "Crédito Mujer",
      monthlyRate: 0.018,
      terms: {
        termMonths: 48,
        target: function () { return 15e6; },
        minViable: 1e6,
        note: "Incluye protección oncológica",
      },
    },
    seguros: {
      name: "Rotativo seguros e impuestos",
      monthlyRate: 0.02,
      terms: {
        termMonths: 11,
        target: function () { return 5e6; },
        minViable: 4e5,
        note: "",
      },
    },
    complementario: {
      name: "Crédito complementario",
      monthlyRate: 0.02,
      terms: {
        termMonths: 24,
        target: function () { return 5e6; },
        minViable: 4e5,
        note: "",
      },
    },
  };

  /** Orden de presentación del portafolio, estable e independiente del objeto. */
  const PRODUCT_ORDER = Object.keys(PRODUCTS);

  /**
   * Señales que el motor puede nombrar, con el token de color con el que se
   * dibujan en el gráfico de contribución al puntaje.
   *
   * Los valores son referencias a variables CSS (assets/css/tokens.css): el
   * motor no conoce ningún hexadecimal. Cambiar la paleta es editar el token,
   * no el JavaScript.
   */
  const SIGNAL_COLORS = {
    "Uso frecuente de la red": "var(--accent)",
    "Intención de compra": "var(--sig-sand)",
    "Ingresos no bancarizados": "var(--sig-green)",
    "Etapa de inicio": "var(--sig-slate)",
    "Obligaciones externas costosas": "var(--sig-red)",
    "Intención de consolidar": "var(--sig-red-soft)",
    "Evento de vivienda": "var(--info)",
    "Estabilidad sostenida": "var(--sig-green-2)",
    "Capacidad por categoría": "var(--sig-slate-2)",
    "Hijos en edad escolar": "var(--sig-violet)",
    "Intención formativa": "var(--sig-violet-2)",
    "Matrícula próxima": "var(--sig-violet-3)",
    "Perfil de cuidado": "var(--sig-pink)",
    "Mejora del hogar": "var(--sig-pink-2)",
    Estacionalidad: "var(--sig-green-3)",
    "Actividad RUES": "var(--sig-green-4)",
    "Necesidad puntual": "var(--sig-slate)",
  };

  /** Color por defecto de una señal no catalogada. */
  const SIGNAL_COLOR_FALLBACK = "var(--sig-slate)";

  /**
   * Los cuatro veredictos posibles, con el modificador de píldora y la
   * etiqueta que ve el analista.
   */
  const VERDICTS = {
    viable: { modifier: "viable", label: "Viable" },
    viable_condiciones: { modifier: "conditions", label: "Con condiciones" },
    mejor_momento: { modifier: "timing", label: "Mejor momento" },
    no_viable: { modifier: "wellbeing", label: "Ruta de bienestar" },
  };

  /** Días de la semana, índice 0 = lunes (coincide con el mapa de calor). */
  const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  /** Señal dominante y condiciones comerciales, para la vista de portafolio. */
  const PORTFOLIO_RULES = [
    ["Cupo rotativo", "Uso frecuente de la red; liquidez del día a día", "$150.000 – $5.000.000, reutilizable"],
    ["Compra de cartera", "Obligaciones externas costosas detectadas en centrales", "Unifica a menor tasa y mejor plazo"],
    ["Crédito hipotecario", "Evento de vivienda con estabilidad sostenida", "UVR o pesos, plazo según capacidad"],
    ["Crédito educativo", "Matrícula, formación o intención detectada", "Cualquier nivel acreditado"],
    ["Crédito Mujer", "Afiliada con necesidad y perfil de cuidado", "Montos adaptables + protección oncológica"],
    ["Rotativo seguros e impuestos", "Estacionalidad de impuestos o pólizas", "Hasta $5.000.000 · hasta 11 meses"],
    ["Crédito complementario", "Necesidad puntual fuera de las líneas anteriores", "Línea adicional del portafolio"],
  ];

  /**
   * Inventario de fuentes de enriquecimiento con su base jurídica.
   * Alimenta la vista «Fuentes y consentimiento», que es la evidencia de
   * cumplimiento de Habeas Data ante el jurado y ante una auditoría.
   */
  const DATA_SOURCES = [
    ["Centrales de información", "Obligaciones vigentes con otras entidades: saldo, tasa y comportamiento", "Ley 1266 de 2008 · autorización expresa del titular", "Diaria"],
    ["Verificación documental", "Correo y canales de contacto verificados", "Ley 1581 de 2012 · consentimiento de canal", "Al ingreso"],
    ["Presencia digital agregada", "Intereses y actividad económica declarada públicamente", "Ley 1581 · consentimiento explícito y revocable", "Semanal"],
    ["Data alternativa de pagos", "Regularidad de ingresos no bancarizados", "Autorización del titular", "Mensual"],
    ["Registros públicos (RUES)", "Actividad económica registrada", "Dato público", "Mensual"],
    ["Ecosistema Colsubsidio", "Uso de servicios, aportes y trayectoria de afiliación", "Relación de afiliación", "Diaria"],
    ["Actividad digital propia", "Sesiones y aperturas para la ventana de contacto", "Relación de afiliación", "Diaria"],
  ];

  ORIGEN.core.catalog = {
    LIFE_STAGES,
    PRODUCTS,
    PRODUCT_ORDER,
    SIGNAL_COLORS,
    SIGNAL_COLOR_FALLBACK,
    VERDICTS,
    WEEKDAYS,
    PORTFOLIO_RULES,
    DATA_SOURCES,
  };
})(window.ORIGEN);
