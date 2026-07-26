/**
 * ORIGEN · Vista «Simulador interactivo»
 * ---------------------------------------------------------------------------
 * Consulta en vivo sobre cualquier cédula, con las fuentes exógenas
 * conmutables una por una.
 *
 * Es la demostración más fuerte del valor del enriquecimiento: al apagar
 * «Centrales de información» la decisión cambia delante del jurado y el índice
 * de confianza cae. No hay que explicarlo, se ve.
 *
 * Dependencias: core/namespace.js, core/format.js,
 *               domain/advanced/*, ui/{dom,toast}.js
 */
(function (ORIGEN) {
  "use strict";

  const { escapeHtml, money } = ORIGEN.core.format;
  const advanced = ORIGEN.domain.advanced;

  /** Cédulas de demostración, con el camino que ejercitan. */
  const DEMOS = [
    ["10000053", "María · consumo"],
    ["10000325", "Andrés · cupo"],
    ["10000087", "Carlos · no viable"],
  ];

  /** Estado de la consulta actual. Local a la vista. */
  let currentId = null;
  let reportedIncome = null;
  let enabled = advanced.sources.allEnabled();

  /** Etiqueta de veredicto. */
  const STATUS_PILL = {
    viable: ["viable", "Viable ahora"],
    cond: ["conditions", "Viable con condiciones"],
    espera: ["timing", "Viable · mejor momento después"],
    no: ["wellbeing", "No viable hoy"],
  };

  function render(container) {
    container.innerHTML =
      '<div class="phead"><div><h1>Simulador interactivo de decisión</h1>' +
      '<div class="phead__sub">Consulta en vivo modificando las fuentes exógenas.</div></div></div>' +

      '<div class="card"><div class="card__body querybar">' +
      '<div class="querybar__field">' +
      '<label class="querybar__label" for="sim-id">Número de cédula</label>' +
      '<input class="querybar__input" id="sim-id" type="text" inputmode="numeric" placeholder="10000053">' +
      "</div>" +
      '<button class="btn btn--primary" type="button" data-sim="run">Analizar</button>' +
      "</div></div>" +

      '<div class="filters">' +
      DEMOS.map(function (demo) {
        return '<button class="fchip" type="button" data-sim-demo="' + demo[0] + '">' +
          demo[1] + "</button>";
      }).join("") +
      '<button class="fchip" type="button" data-sim-demo="random">Aleatoria</button>' +
      "</div>" +

      '<div id="sim-sources"></div><div id="sim-output"></div>';
  }

  /**
   * Lanza la consulta con la animación de fuentes respondiendo una por una.
   * La secuencia es teatro deliberado: hace visible que hay cinco fuentes
   * distintas detrás y que cada una tiene su base jurídica.
   */
  function run(id) {
    currentId = id;
    reportedIncome = null;
    enabled = advanced.sources.allEnabled();

    const sources = advanced.sources.SOURCES;
    const container = ORIGEN.ui.dom.byId("sim-sources");

    container.innerHTML =
      '<div class="card"><div class="card__body">' +
      '<div class="card__hint card__hint--block">Consultando fuentes exógenas…</div>' +
      sources.map(function (source) {
        return (
          '<div class="srcprobe" id="probe-' + source.key + '">' +
          '<div class="srcprobe__badge">' + escapeHtml(source.name.charAt(0)) + "</div>" +
          '<div class="srcprobe__body"><span>' + escapeHtml(source.name) + "</span>" +
          '<span class="srcprobe__legal">' + escapeHtml(source.legalBasis) + "</span></div>" +
          '<div class="srcprobe__status" id="probe-status-' + source.key + '">en espera</div>' +
          "</div>"
        );
      }).join("") +
      "</div></div>";

    ORIGEN.ui.dom.byId("sim-output").innerHTML = "";

    const STEP_MS = 250;

    sources.forEach(function (source, index) {
      setTimeout(function () {
        const probe = ORIGEN.ui.dom.byId("probe-" + source.key);
        if (!probe) return;
        probe.classList.add("srcprobe--asking");
        ORIGEN.ui.dom.byId("probe-status-" + source.key).textContent = "consultando…";
      }, index * STEP_MS);

      setTimeout(function () {
        const probe = ORIGEN.ui.dom.byId("probe-" + source.key);
        if (!probe) return;
        probe.classList.remove("srcprobe--asking");
        probe.classList.add("srcprobe--done");
        ORIGEN.ui.dom.byId("probe-status-" + source.key).textContent = "✓ respondió";
      }, index * STEP_MS + 500);
    });

    setTimeout(paint, sources.length * STEP_MS + 600);
  }

  /** Hallazgo resumido de cada fuente, para el conmutador. */
  function findingFor(key, profile) {
    if (!enabled[key]) return "desactivada";
    if (key === "bureau") {
      return profile.obligations
        ? profile.obligations + " obl. · " + money(profile.externalBalance)
        : "sin deuda";
    }
    if (key === "alt") return profile.regularIncomeMonths + " meses de ingresos";
    if (key === "pub") return profile.hasRues ? "RUES ok" : "sin RUES";
    if (key === "dig") return "digital: " + profile.digitalScore + "/100";
    return profile.hasEmail ? "correo ok" : "sin correo";
  }

  /** Pinta el resultado de la consulta. */
  function paint() {
    if (!currentId) return;

    const decision = advanced.decide(currentId, reportedIncome, enabled);
    const p = decision.profile;
    const pill = STATUS_PILL[decision.eligibility.status];

    const toggles = advanced.sources.SOURCES.map(function (source) {
      const on = enabled[source.key];
      return (
        '<div class="srctoggle">' +
        '<button class="switch' + (on ? " switch--on" : "") + '" type="button"' +
        ' role="switch" aria-checked="' + (on ? "true" : "false") + '"' +
        ' data-sim-toggle="' + source.key + '"' +
        ' aria-label="' + escapeHtml(source.name) + '"><span class="switch__knob"></span></button>' +
        '<div class="srctoggle__body">' +
        '<div class="srctoggle__name' + (on ? "" : " is-off") + '">' + escapeHtml(source.name) + "</div>" +
        '<div class="srctoggle__finding">Hallazgo: ' + escapeHtml(findingFor(source.key, p)) + "</div>" +
        "</div></div>"
      );
    }).join("");

    const stagePills = advanced.lifestage.STAGES.map(function (stage, index) {
      return (
        '<span class="stagepill' + (index === decision.stage.index ? " stagepill--on" : "") + '">' +
        escapeHtml(stage) + "</span>"
      );
    }).join("");

    const signals = decision.signals.map(function (signal, index) {
      return (
        '<div class="signal">' +
        '<div class="signal__head"><span>' + escapeHtml(signal.name) +
        ' <span class="signal__source">(' + escapeHtml(signal.source) + ")</span></span>" +
        '<span class="num">' + signal.weight + "%</span></div>" +
        '<div class="signal__track"><i class="signal__fill' + (index === 0 ? " signal__fill--top" : "") +
        '" style="width:' + Math.min(100, signal.weight * 2.6) + '%"></i></div>' +
        "</div>"
      );
    }).join("");

    const alternatives = decision.alternatives.map(function (alternative, index) {
      const isBest = index === 0;
      return (
        "<tr>" +
        '<td><div class="cell-name' + (isBest ? " cell-name--best" : "") + '">' +
        escapeHtml(alternative.product) + "</div>" +
        '<div class="cell-sub cell-sub--wrap">' +
        escapeHtml(alternative.description || alternative.dismissal) + "</div></td>" +
        '<td class="is-right num altscore' + (isBest ? " altscore--best" : "") + '">' +
        alternative.score + "</td></tr>"
      );
    }).join("");

    // Mockup del cierre digital: solo tiene sentido en canal automático.
    const closing =
      decision.delivery.kind === "advisor"
        ? ""
        : '<div class="closing">' +
          "<h4>Cierre de venta · mockup de la app</h4>" +
          '<div class="closing__shots">' +
          ["cierre_1.png", "cierre_2.png", "cierre_3.png"]
            .map(function (file, index) {
              const alt = ["Oferta", "Desglose", "Desembolso"][index];
              return '<img src="assets/img/' + file + '" alt="' + alt + '" loading="lazy">';
            })
            .join("") +
          "</div>" +
          '<div class="resnote resnote--left">Experiencia en el canal digital con ' +
          "transparencia total en tasas, seguros (FGA) y cuota final.</div></div>";

    const body =
      decision.delivery.kind === "advisor"
        ? "<strong>Guion para el asesor</strong><br><br>" + escapeHtml(decision.message) +
          "<br><br><em>Registrar la respuesta y el motivo si se anula la recomendación.</em>"
        : escapeHtml(decision.message);

    const confidenceClass =
      decision.confidence >= 0.8 ? "is-ok" : decision.confidence >= 0.65 ? "is-warn" : "is-risk";

    ORIGEN.ui.dom.byId("sim-output").innerHTML =
      '<div class="fichagrid"><div>' +

      card("Fuentes exógenas", "Conmutables",
        toggles +
        '<div class="resnote resnote--left">Desactiva fuentes para ver cómo el motor ' +
        "recalcula la decisión en tiempo real.</div>") +

      card("Etapa de vida y momento", "Política aplicada",
        '<div class="stagepills">' + stagePills + "</div>" +
        '<p class="stagereason"><strong>' + escapeHtml(decision.stage.stage) + ".</strong> " +
        escapeHtml(decision.stage.reason) + "</p>" +
        '<div class="kpis kpis--tight">' +
        miniKpi("Cuota tolerable", Math.round(decision.eligibility.tolerance * 100) + "%", "") +
        miniKpi("Plazo máximo", decision.stage.maxTermMonths + " m", "") +
        miniKpi("Momento", decision.window.shouldWait ? "Después" : "Ahora",
          decision.window.shouldWait ? "is-warn" : "is-ok") +
        "</div>" +
        '<div class="resnote resnote--left">' + escapeHtml(decision.window.reason) + "</div>") +

      card("Señales pesadas", "Reparto de 100 puntos", signals) +

      card("Alternativas deliberadas", decision.alternatives.length + " evaluadas",
        '<table class="alttable"><tbody>' + alternatives + "</tbody></table>", true) +

      "</div><div class=\"rail2\">" +

      '<div class="card"><div class="card__body">' +
      '<div class="sstat__label">Decisión del motor</div>' +
      '<div class="simverdict"><span class="pill pill--lg pill--' + pill[0] + '">' + pill[1] + "</span></div>" +
      '<div class="sstat__label">Producto asignado</div>' +
      '<div class="simproduct">' + escapeHtml(decision.best.product) + "</div>" +
      '<div class="sstat__label">Índice de confianza (DCI)</div>' +
      '<div class="simdci ' + confidenceClass + '">' + decision.confidence.toFixed(2) + "</div>" +
      "</div></div>" +

      '<div class="resolution">' +
      '<div class="res__head"><div class="res__title">Entrega y canal</div>' +
      '<div class="res__ref">' + escapeHtml(decision.delivery.channel) + "</div></div>" +
      '<div class="res__body">' +
      '<div class="drow"><div class="drow__key">Momento</div>' +
      '<div class="drow__value">' + escapeHtml(decision.delivery.moment) + "</div></div>" +
      '<div class="drow"><div class="drow__key">Justificación</div>' +
      '<div class="drow__value">' + escapeHtml(decision.delivery.reason) + "</div></div>" +
      '<div class="reasonbox">' + body + "</div>" +
      closing +
      "</div></div>" +

      "</div></div>";
  }

  function card(title, hint, body, flush) {
    return (
      '<div class="card"><div class="card__head"><h3>' + title + "</h3>" +
      (hint ? '<span class="card__hint">' + hint + "</span>" : "") + "</div>" +
      '<div class="card__body' + (flush ? " card__body--flush" : "") + '">' + body + "</div></div>"
    );
  }

  function miniKpi(label, value, modifier) {
    return (
      '<div class="kpi kpi--mini"><div class="kpi__label">' + label + "</div>" +
      '<div class="kpi__value ' + modifier + '">' + value + "</div></div>"
    );
  }

  /** Conmuta una fuente y repinta sin relanzar la animación. */
  function toggleSource(key) {
    enabled[key] = !enabled[key];
    paint();
  }

  /** Valida y lanza la consulta desde el campo de texto. */
  function submit() {
    const input = ORIGEN.ui.dom.byId("sim-id");
    const digits = input.value.trim().replace(/\D/g, "");

    if (digits.length < 6) {
      ORIGEN.ui.toast.show("Cédula inválida", "Ingresa una cédula de al menos 6 dígitos.", true);
      return;
    }

    run(digits);
  }

  /** Carga una cédula de demostración, o una aleatoria. */
  function demo(value) {
    const id =
      value === "random" ? String(Math.floor(Math.random() * 9e7 + 1e7)) : value;
    ORIGEN.ui.dom.byId("sim-id").value = id;
    run(id);
  }

  ORIGEN.ui.views = ORIGEN.ui.views || {};
  ORIGEN.ui.views.simulator = { render, submit, demo, toggleSource };
})(window.ORIGEN);
