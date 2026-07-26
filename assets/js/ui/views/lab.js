/**
 * ORIGEN · Vista «Laboratorio de evidencia»
 * ---------------------------------------------------------------------------
 * Ejecuta el backtest y presenta el resultado.
 *
 * El experimento es intensivo y corre en el hilo principal, así que se cede un
 * fotograma antes de arrancar para que el mensaje de «ejecutando» alcance a
 * pintarse. Con 20.000 afiliados la pestaña queda insensible unos segundos: es
 * el precio de no tener Web Workers, y está declarado en la interfaz.
 *
 * Dependencias: core/namespace.js, domain/lab.js, ui/dom.js
 */
(function (ORIGEN) {
  "use strict";

  /** Tamaños ofrecidos, con su coste aproximado medido en un portátil. */
  const SIZES = [
    { size: 5000, label: "Ejecutar 5.000 afiliados", hint: "≈ 5 s" },
    { size: 20000, label: "Ejecutar 20.000", hint: "≈ 20 s · alta precisión" },
  ];

  function render(container) {
    container.innerHTML =
      '<div class="phead"><div><h1>Laboratorio de evidencia</h1>' +
      '<div class="phead__sub">Backtest sobre población sintética para medir el ' +
      "impacto real de decidir mejor.</div></div>" +
      '<div class="phead__actions">' +
      SIZES.map(function (option, index) {
        return (
          '<button class="btn' + (index === 0 ? " btn--primary" : "") + '" type="button"' +
          ' data-lab="' + option.size + '" title="' + option.hint + '">' + option.label + "</button>"
        );
      }).join("") +
      "</div></div>" +

      '<div class="card"><div class="card__body">' +
      '<div class="resnote resnote--left resnote--prose">' +
      "<strong>Método:</strong> se genera una población sintética en la que el resultado " +
      "—la mora— depende de factores reales: carga externa, inestabilidad laboral, un shock " +
      "imprevisible y la disciplina de pago. Como conocemos la verdad de cada persona, se " +
      "puede medir quién acierta. Se compara ORIGEN contra una <em>línea base</em> " +
      "tradicional, que solo mira datos internos y ofrece un único producto a todos." +
      "<br><br>" +
      "<strong>Advertencia honesta:</strong> es una simulación, no un backtest sobre cartera " +
      "real. Demuestra que la lógica discrimina bien en un mundo cuyas reglas conocemos; no " +
      "predice la mora de Colsubsidio." +
      "</div></div></div>" +

      '<div id="lab-output"></div>';
  }

  /** Lanza el experimento y pinta el informe. */
  function run(size) {
    const output = ORIGEN.ui.dom.byId("lab-output");

    output.innerHTML =
      '<div class="empty"><div class="empty__head">Ejecutando ' +
      size.toLocaleString("es-CO") + " decisiones…</div>" +
      '<div class="empty__note">La pestaña puede quedar insensible unos segundos.</div></div>';

    // Cede un fotograma para que el mensaje anterior se pinte antes de bloquear.
    setTimeout(function () {
      const startedAt = performance.now();
      const result = ORIGEN.domain.lab.run(size);
      const elapsed = Math.round(performance.now() - startedAt);

      output.innerHTML = report(result, elapsed);
    }, 40);
  }

  /** Porcentaje seguro ante denominador cero. */
  function rate(part, total) {
    return total ? (part / total) * 100 : 0;
  }

  /** Construye el informe completo. */
  function report(r, elapsed) {
    const populationRate = rate(r.totalDefaults, r.size);
    const protectedRate = rate(r.protected.defaults, r.protected.count);
    const includedRate = rate(r.included.defaults, r.included.count);
    const commonRate = rate(r.common.defaultsOrigen, r.common.count);

    // Cuántos impagos habría absorbido la línea base y cuántos evita ORIGEN.
    const avoided = r.protected.defaults;
    const baselineDefaults = r.common.defaultsBaseline + r.protected.defaults;
    const reduction = rate(avoided, baselineDefaults);

    // Cuánto mejor discrimina la protección que el azar poblacional.
    const lift = populationRate ? protectedRate / populationRate : 0;

    const relevanceOrigen = rate(r.origen.relevant, r.origen.approved);
    const relevanceBaseline = rate(r.baseline.relevant, r.baseline.approved);
    const acceptOrigen = rate(r.origen.accepted, r.size);
    const acceptBaseline = rate(r.baseline.accepted, r.size);

    const equity = Object.keys(r.equity).map(function (dimension) {
      const groups = r.equity[dimension];
      const rows = Object.keys(groups).map(function (group) {
        const entry = groups[group];
        return (
          '<tr><td class="cell-name">' + group + "</td>" +
          '<td class="is-right num">' + entry.count.toLocaleString("es-CO") + "</td>" +
          '<td class="is-right num">' + rate(entry.approved, entry.count).toFixed(1) + "%</td></tr>"
        );
      }).join("");

      return (
        '<div class="card"><div class="card__head"><h3>Equidad por ' + dimension.toLowerCase() +
        '</h3><span class="card__hint">Tasa de aprobación</span></div>' +
        '<div class="card__body card__body--flush"><table><thead><tr>' +
        "<th>Grupo</th><th class=\"is-right\">Volumen</th><th class=\"is-right\">Aprobación</th>" +
        "</tr></thead><tbody>" + rows + "</tbody></table></div></div>"
      );
    }).join("");

    const ablation = Object.keys(r.ablation).map(function (name) {
      const entry = r.ablation[name];
      const delta = entry.defaultRate - r.ablation.completa.defaultRate;
      const worse = delta > 0.1;

      return (
        '<tr><td class="cell-name">' + (name === "completa" ? "Todas las fuentes" : name) + "</td>" +
        '<td class="is-right num' + (worse ? " is-risk" : " is-ok") + '">' +
        entry.defaultRate.toFixed(1) + "%" +
        (worse ? ' <span class="delta">(+' + delta.toFixed(1) + ")</span>" : "") + "</td>" +
        '<td class="is-right num">' + entry.confidence.toFixed(2) + "</td></tr>"
      );
    }).join("");

    return (
      '<div class="kpis">' +
      kpi("", "Tiempo de proceso", elapsed + " ms", r.size.toLocaleString("es-CO") + " decisiones") +
      kpi("ok", "Mora evitada", "-" + reduction.toFixed(0) + "%",
        avoided.toLocaleString("es-CO") + " impagos evitados") +
      kpi("accent", "Inclusión sana", "+" + r.included.count.toLocaleString("es-CO"),
        "aprobados que la base rechazaba") +
      kpi("", "Precisión (lift)", "×" + lift.toFixed(1), "protección frente al azar") +
      "</div>" +

      '<div class="fichagrid"><div>' +

      '<div class="card"><div class="card__head"><h3>Matriz de impacto frente al proceso actual</h3>' +
      '<span class="card__hint">Mora poblacional ' + populationRate.toFixed(1) + "%</span></div>" +
      '<div class="card__body card__body--flush"><table><thead><tr>' +
      "<th>Población</th><th class=\"is-right\">Volumen</th>" +
      "<th class=\"is-right\">Mora</th><th>Interpretación</th>" +
      "</tr></thead><tbody>" +
      quadrant("Protegidos por ORIGEN", "La base los aprobaba; ORIGEN los frenó",
        r.protected.count, protectedRate, "is-risk",
        "El motor detectó deuda oculta y los frenó.") +
      quadrant("Incluidos por ORIGEN", "La base los rechazaba; ORIGEN los aprobó",
        r.included.count, includedRate, "is-ok",
        "Nuevos afiliados con riesgo sano.") +
      quadrant("Cosecha común", "Ambos aprueban",
        r.common.count, commonRate, "",
        "Cartera núcleo de bajo riesgo.") +
      quadrant("Ninguno aprueba", "Coinciden en rechazar",
        r.neitherApproves.count, rate(r.neitherApproves.defaults, r.neitherApproves.count), "",
        "Sin disputa entre los dos criterios.") +
      "</tbody></table></div></div>" +

      '<div class="card"><div class="card__head"><h3>Pertinencia y aceptación</h3>' +
      '<span class="card__hint">ORIGEN frente a línea base</span></div>' +
      '<div class="card__body card__body--flush"><table><thead><tr>' +
      "<th>Métrica</th><th class=\"is-right\">Línea base</th>" +
      "<th class=\"is-right\">ORIGEN</th><th class=\"is-right\">Diferencia</th>" +
      "</tr></thead><tbody>" +
      '<tr><td class="cell-name">El producto coincide con la necesidad real</td>' +
      '<td class="is-right num">' + relevanceBaseline.toFixed(1) + "%</td>" +
      '<td class="is-right num is-accent">' + relevanceOrigen.toFixed(1) + "%</td>" +
      '<td class="is-right num is-ok">+' + (relevanceOrigen - relevanceBaseline).toFixed(1) + " pp</td></tr>" +
      '<tr><td class="cell-name">Tasa de aceptación esperada</td>' +
      '<td class="is-right num">' + acceptBaseline.toFixed(1) + "%</td>" +
      '<td class="is-right num is-accent">' + acceptOrigen.toFixed(1) + "%</td>" +
      '<td class="is-right num is-ok">×' +
      (acceptBaseline ? (acceptOrigen / acceptBaseline).toFixed(1) : "—") + "</td></tr>" +
      "</tbody></table></div></div>" +

      "</div><div>" +

      '<div class="card"><div class="card__head"><h3>Estudio de ablación</h3>' +
      '<span class="card__hint">Valor de cada fuente</span></div>' +
      '<div class="card__body card__body--flush"><table><thead><tr>' +
      "<th>Fuentes activas</th><th class=\"is-right\">Mora proyectada</th>" +
      "<th class=\"is-right\">DCI medio</th>" +
      "</tr></thead><tbody>" + ablation + "</tbody></table></div>" +
      '<div class="card__body card__body--tight">' +
      '<div class="resnote resnote--left">Cuánto empeora la cartera al apagar una fuente. ' +
      "Es el retorno exacto de pagar por datos exógenos.</div></div></div>" +

      equity +

      "</div></div>"
    );
  }

  function quadrant(name, note, count, defaultRate, modifier, reading) {
    return (
      "<tr><td><div class=\"cell-name\">" + name + "</div>" +
      '<div class="cell-sub cell-sub--wrap">' + note + "</div></td>" +
      '<td class="is-right num">' + count.toLocaleString("es-CO") + "</td>" +
      '<td class="is-right num ' + modifier + '">' + defaultRate.toFixed(1) + "%</td>" +
      '<td class="quadrant__reading">' + reading + "</td></tr>"
    );
  }

  function kpi(modifier, label, value, note) {
    return (
      '<div class="kpi' + (modifier ? " kpi--" + modifier : "") + '">' +
      '<div class="kpi__label">' + label + "</div>" +
      '<div class="kpi__value">' + value + "</div>" +
      '<div class="kpi__note">' + note + "</div></div>"
    );
  }

  ORIGEN.ui.views = ORIGEN.ui.views || {};
  ORIGEN.ui.views.lab = { render, run };
})(window.ORIGEN);
