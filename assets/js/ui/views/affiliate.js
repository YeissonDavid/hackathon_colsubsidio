/**
 * ORIGEN · Vista «Ficha de decisión»
 * ---------------------------------------------------------------------------
 * El detalle de un afiliado: enriquecimiento con su base jurídica, capacidad
 * de pago, deliberación del portafolio, proyección a doce meses, ventana de
 * contacto y la resolución con sus acciones.
 *
 * Es la pantalla que se proyecta en la demostración, así que el
 * enmascaramiento de PII se aplica aquí igual que en el listado — nombre,
 * cédula y correo incluidos.
 *
 * Dependencias: core/namespace.js, core/{format,catalog}.js,
 *               domain/dataset.js, ui/{dom,privacy,charts,blocks}.js
 */
(function (ORIGEN) {
  "use strict";

  const { escapeHtml, money, initials, term } = ORIGEN.core.format;
  const { LIFE_STAGES, PRODUCTS, VERDICTS } = ORIGEN.core.catalog;

  /**
   * Variables exógenas con su fuente y base jurídica.
   * Es la evidencia de que cada dato que entra al motor está autorizado.
   */
  function exogenousRows(d) {
    const a = d.affiliate;
    const privacy = ORIGEN.ui.privacy;

    return [
      {
        variable: "Correo verificado",
        value: privacy.maskEmail(a.email),
        source: "Verificación documental",
        legal: "Ley 1581 de 2012 · consentimiento de canal",
        flag: false,
      },
      {
        variable: "Obligaciones con otras entidades",
        value:
          a.externalDebt.count > 0
            ? a.externalDebt.count + " · " + money(a.externalDebt.balance) + " · " +
              a.externalDebt.annualRate + "% E.A."
            : "Sin obligaciones externas",
        source: "Centrales de información",
        legal: "Ley 1266 de 2008 · autorización del titular",
        flag: a.externalDebt.count > 0,
      },
      {
        variable: "Ingresos no bancarizados",
        value:
          a.unbankedIncomeMonths > 0
            ? a.unbankedIncomeMonths + " meses con regularidad"
            : "No aplica",
        source: "Data alternativa de pagos",
        legal: "Autorización del titular",
        flag: false,
      },
      {
        variable: "Actividad económica registrada",
        value: a.hasRuesActivity ? "Registrada en RUES" : "No registrada",
        source: "Registros públicos",
        legal: "Dato público",
        flag: false,
      },
      {
        variable: "Ventana de conexión",
        value: d.contactWindowLabel,
        source: "Actividad digital del afiliado",
        legal: "Relación de afiliación",
        flag: false,
      },
    ];
  }

  /** Panel lateral de resolución, con su cuerpo distinto según el veredicto. */
  function resolutionPanel(d) {
    const isRoute = d.verdict === "no_viable";
    const confidencePct = Math.round(d.confidence * 100);
    const maskedId = escapeHtml(ORIGEN.ui.privacy.maskId(d.affiliate.id));

    const body = isRoute
      ? resrow("Determinación", "Sin desembolso hoy", "Educación financiera y ahorro programado.") +
        resrow("Recalificación", "6 meses", "Automática, sin nueva solicitud del afiliado.") +
        resrow("Contacto", d.channel, "Con fecha cierta de retorno.")
      : resrow(
          "Producto",
          d.isSequenced ? "Compra de cartera → Crédito Mujer" : PRODUCTS[d.product].name,
          d.note || ""
        ) +
        resrow("Monto", money(d.amount), "") +
        resrow(
          "Cuota / plazo",
          money(d.installment) + " · " + term(d.termMonths),
          "Modalidad " + d.modality + "."
        ) +
        resrow("Entrega", d.channel, d.contactWindowLabel);

    const actions = isRoute
      ? '<button class="btn btn--risk" type="button" data-act="ruta">Activar ruta de bienestar</button>' +
        '<button class="btn" type="button" data-act="asesor">Asignar a asesor</button>'
      : '<button class="btn btn--ok" type="button" data-act="aprobar">Aprobar resolución</button>' +
        '<button class="btn" type="button" data-act="ajustar">Ajustar condiciones</button>' +
        '<button class="btn" type="button" data-act="ruta">Enviar a ruta de bienestar</button>';

    return (
      '<div class="resolution">' +
      '<div class="res__head">' +
      '<div class="res__title">' + (isRoute ? "Ruta de bienestar" : "Resolución de crédito") + "</div>" +
      '<div class="res__ref">ORIGEN · ' + maskedId + "</div>" +
      "</div>" +
      '<div class="res__body">' + body + "</div>" +
      '<div class="reasonbox">“' + escapeHtml(d.reason) + "”</div>" +
      '<div class="confblock">' +
      '<div class="confblock__label"><span>Confianza del motor</span><span>' + confidencePct + " %</span></div>" +
      '<div class="confblock__track"><i class="confblock__fill" style="width:' + confidencePct + '%"></i></div>' +
      "</div>" +
      '<div class="resactions">' + actions +
      '<div class="resnote">Toda resolución queda registrada con sus variables, fuentes y base jurídica.</div>' +
      "</div></div>"
    );
  }

  /** Fila del panel de resolución. */
  function resrow(key, value, note) {
    return (
      '<div class="resrow">' +
      '<div class="resrow__key">' + key + "</div>" +
      '<div class="resrow__value">' + value + "</div>" +
      (note ? '<div class="resrow__note">' + note + "</div>" : "") +
      "</div>"
    );
  }

  /** Tarjeta con cabecera, pista y cuerpo. */
  function card(title, hint, body) {
    return (
      '<div class="card">' +
      '<div class="card__head"><h3>' + title + "</h3>" +
      (hint ? '<span class="card__hint">' + hint + "</span>" : "") + "</div>" +
      '<div class="card__body">' + body + "</div>" +
      "</div>"
    );
  }

  /**
   * Pinta la ficha de un afiliado.
   *
   * @param {HTMLElement} container
   * @param {number} index Índice de la decisión en el conjunto.
   */
  function render(container, index) {
    const d = ORIGEN.domain.dataset.at(index);
    if (!d) return;

    const a = d.affiliate;
    const privacy = ORIGEN.ui.privacy;
    const verdict = VERDICTS[d.verdict];

    const displayName = escapeHtml(privacy.maskName(a.name));
    const displayId = escapeHtml(privacy.maskId(a.id));

    const exogenous = exogenousRows(d)
      .map(function (r) {
        return (
          "<tr>" +
          "<td>" + r.variable + "</td>" +
          '<td class="srctable__value' + (r.flag ? " srctable__value--flag" : "") + '">' +
          escapeHtml(r.value) + "</td>" +
          '<td class="srctable__legal">' + r.source + "</td>" +
          '<td class="srctable__legal">' + r.legal + "</td>" +
          "</tr>"
        );
      })
      .join("");

    container.innerHTML =
      '<button class="backlink" type="button" data-goto="bandeja">← Bandeja de decisión</button>' +

      '<div class="subject">' +
      '<div class="subject__avatar">' + escapeHtml(initials(privacy.maskName(a.name))) + "</div>" +
      "<div>" +
      '<div class="subject__name">' + displayName + "</div>" +
      '<div class="subject__meta">' + displayId + " · " + a.age + " años · Categoría " +
      escapeHtml(a.category) + " · " + escapeHtml(a.contractType) + "</div>" +
      "</div>" +
      '<div class="subject__stats">' +
      sstat("Ingreso", money(a.income), "") +
      sstat("Vinculación", a.tenureMonths + " m", "") +
      sstat("Hogar", a.children + " hijo(s)", "") +
      sstat("Momento de vida", LIFE_STAGES[a.lifeStage].name, "lifestage") +
      '<span class="pill pill--lg pill--' + verdict.modifier + '">' + verdict.label + "</span>" +
      "</div></div>" +

      '<div class="fichagrid"><div>' +
      card(
        "Enriquecimiento exógeno",
        "Fuente y base jurídica",
        '<table class="srctable"><thead><tr>' +
          '<th style="width:34%">Variable</th><th style="width:26%">Valor</th>' +
          '<th style="width:20%">Fuente</th><th>Base jurídica</th>' +
          "</tr></thead><tbody>" + exogenous + "</tbody></table>"
      ) +
      card(
        "Capacidad de pago y cumplimiento de política",
        "Ingreso mensual " + money(a.income),
        ORIGEN.ui.blocks.capacityBlock(d)
      ) +
      card("Deliberación del portafolio", "7 productos evaluados", ORIGEN.ui.blocks.deliberationBlock(d)) +
      card("Proyección de bienestar financiero", "12 meses · 3 escenarios", ORIGEN.ui.charts.projectionChart(d)) +
      card("Ventana de contacto", "Actividad digital · 7 días × 18 horas", ORIGEN.ui.charts.engagementHeatmap(d)) +
      "</div>" +
      '<div class="rail2">' + resolutionPanel(d) + "</div>" +
      "</div>";

    // Las barras de deliberación crecen desde cero al entrar en la ficha.
    ORIGEN.ui.dom.animateWidths(ORIGEN.ui.dom.all(".dltrack__seg", container));
  }

  /** Estadística de la cabecera del afiliado. */
  function sstat(label, value, modifier) {
    return (
      "<div>" +
      '<div class="sstat__label">' + label + "</div>" +
      '<div class="sstat__value' + (modifier ? " sstat__value--" + modifier : "") + '">' + value + "</div>" +
      "</div>"
    );
  }

  /**
   * Aplica una acción del analista y devuelve el aviso correspondiente.
   *
   * @param {number} index
   * @param {string} action
   * @returns {{title: string, detail: string, isRisk: boolean}}
   */
  function applyAction(index, action) {
    const d = ORIGEN.domain.dataset.at(index);
    ORIGEN.domain.dataset.resolve(index, action);

    if (action === "aprobar") {
      return {
        title: "Resolución aprobada",
        detail:
          PRODUCTS[d.product].name + " por " + money(d.amount) +
          " · notificación programada para " + d.contactWindowLabel + ".",
        isRisk: false,
      };
    }

    if (action === "ajustar") {
      return {
        title: "Condiciones en ajuste",
        detail: "Se abrió una revisión manual con la trazabilidad del motor adjunta.",
        isRisk: false,
      };
    }

    if (action === "asesor") {
      return {
        title: "Asignado a asesor",
        detail: "Contacto humano con fecha cierta de retorno.",
        isRisk: true,
      };
    }

    return {
      title: "Ruta de bienestar activada",
      detail: "Sin desembolso hoy · recalificación automática en 6 meses.",
      isRisk: true,
    };
  }

  ORIGEN.ui.views = ORIGEN.ui.views || {};
  ORIGEN.ui.views.affiliate = { render, applyAction };
})(window.ORIGEN);
