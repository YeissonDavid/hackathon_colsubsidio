/**
 * ORIGEN · Motor avanzado — viabilidad y momento
 * ---------------------------------------------------------------------------
 * Dos preguntas distintas que suelen confundirse:
 *
 *   `assessEligibility` → ¿se puede prestar?      (riesgo y política)
 *   `findWindow`        → ¿conviene prestar HOY?  (calendario y flujo de caja)
 *
 * Separarlas es lo que permite el veredicto «viable, pero mejor después». Un
 * afiliado puede pasar todos los filtros de riesgo y aun así ser mejor servido
 * esperando dos meses — porque termina un crédito vigente, porque la matrícula
 * es en enero, o porque la prima llega el mes que viene.
 *
 * Dependencias: core/namespace.js, domain/advanced/hash.js
 */
(function (ORIGEN) {
  "use strict";

  const { integer } = ORIGEN.domain.advanced.derive;

  const MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];

  /** Cuota mínima por debajo de la cual la operación no es sostenible. */
  const MIN_VIABLE_INSTALLMENT = 90000;

  /** Carga externa a partir de la cual se bloquea por sobreendeudamiento. */
  const MAX_EXTERNAL_LOAD = 0.42;

  /** Umbrales del riesgo observado: por encima del alto se bloquea. */
  const RISK_HIGH = 0.11;
  const RISK_MODERATE = 0.04;

  /**
   * Evalúa si se puede prestar, y deja constancia de por qué.
   *
   * `riskScore` es una combinación lineal declarada: carga externa e
   * inestabilidad suman riesgo; disciplina de pago e historia lo restan. Los
   * pesos están a la vista para poder discutirlos — es lo contrario de un
   * modelo entrenado cuyos coeficientes nadie puede auditar.
   *
   * @returns {object} estado ('viable'|'cond'|'no'), motivos y cuota máxima.
   */
  function assessEligibility(profile, enabled, stage) {
    const requiredMonths = profile.isPermanent ? 2 : 6;
    const reasons = [];

    if (profile.employmentMonths < requiredMonths) {
      reasons.push(
        "Lleva " + profile.employmentMonths + " " +
        (profile.employmentMonths === 1 ? "mes" : "meses") +
        " en el empleo actual; la línea exige " + requiredMonths + " para contrato " +
        (profile.isPermanent ? "a término indefinido" : "distinto a indefinido") + "."
      );
    }

    const tolerance = stage ? stage.installmentTolerance : 0.3;
    const maxInstallment = profile.income * tolerance - profile.externalPayment;
    const externalLoad = profile.income ? profile.externalPayment / profile.income : 0;

    if (enabled.bureau && externalLoad > MAX_EXTERNAL_LOAD) {
      reasons.push(
        "Su carga financiera externa representa el " + Math.round(externalLoad * 100) +
        "% del ingreso."
      );
    }

    if (maxInstallment < MIN_VIABLE_INSTALLMENT) {
      reasons.push("La capacidad disponible no permite una cuota sostenible hoy.");
    }

    // Trayectoria corta combinada con carga alta: la peor mezcla.
    const unstable =
      profile.employmentMonths < 10 && profile.affiliationYears < 3 && externalLoad > 0.3;

    if (unstable) {
      reasons.push("Trayectoria laboral corta con alta carga: riesgo de sobreendeudamiento.");
    }

    const instability = 1 - Math.min(1, profile.employmentMonths / 36);
    const discipline = (profile.paymentBehaviour - 60) / 40;
    const history = Math.min(1, profile.affiliationYears / 8);

    const riskScore =
      0.4 * externalLoad + 0.3 * instability - 0.2 * discipline - 0.08 * history;

    if (riskScore > RISK_HIGH) {
      reasons.push(
        "El perfil de riesgo observado (carga " + Math.round(externalLoad * 100) + "%, " +
        profile.employmentMonths + " meses de vinculación, disciplina de pago " +
        profile.paymentBehaviour + "/100) supera el umbral prudente."
      );
    } else if (riskScore > RISK_MODERATE) {
      reasons.push("Perfil de riesgo moderado: se ajustan condiciones y se acorta el plazo.");
    }

    let status = "viable";
    if (
      riskScore > RISK_HIGH ||
      externalLoad > MAX_EXTERNAL_LOAD ||
      unstable ||
      maxInstallment < MIN_VIABLE_INSTALLMENT
    ) {
      status = "no";
    } else if (
      riskScore > RISK_MODERATE ||
      externalLoad > 0.3 ||
      profile.employmentMonths < requiredMonths
    ) {
      status = "cond";
    }

    return {
      status,
      reasons,
      maxInstallment: Math.max(0, maxInstallment),
      externalLoad,
      requiredMonths,
      tolerance,
      riskScore,
    };
  }

  /**
   * Busca la mejor ventana temporal para la operación.
   *
   * Tres oportunidades, en orden de valor para el afiliado:
   *   1. Un crédito interno a punto de terminar libera capacidad real.
   *   2. El calendario académico concentra las matrículas: adelantarse cuesta
   *      intereses innecesarios.
   *   3. La prima de junio o diciembre permite un abono inicial que baja la
   *      cuota de todo el plazo.
   *
   * @returns {object} shouldWait, cuándo, motivo y beneficio cuantificado.
   */
  function findWindow(profile, stage, eligibility) {
    const { money } = ORIGEN.core.format;
    const currentMonth = new Date().getMonth();
    const monthAhead = function (offset) {
      return MONTHS[(currentMonth + offset) % 12];
    };

    // 1. Crédito interno por terminar.
    if (
      profile.internalCreditMonthsLeft > 0 &&
      profile.internalCreditMonthsLeft <= 4 &&
      eligibility.maxInstallment > 0
    ) {
      const freed = profile.income * 0.08;
      const months = profile.internalCreditMonthsLeft;

      return {
        shouldWait: true,
        when: monthAhead(months),
        months,
        reason:
          "Su crédito vigente termina en " + months + " " + (months === 1 ? "mes" : "meses") +
          ". Al cerrarlo libera cerca de " + money(freed) + " mensuales: esperando accede al " +
          "mismo objetivo con una cuota más holgada o a un monto mayor sin subir su carga.",
        benefit: "≈ " + money(freed * 12) + " de capacidad anual adicional",
      };
    }

    // 2. Calendario académico: matrículas en enero y julio.
    if (
      stage.prioritise.indexOf("Crédito educativo") !== -1 &&
      currentMonth !== 0 &&
      currentMonth !== 6 &&
      (currentMonth < 5 || currentMonth > 7)
    ) {
      const target = currentMonth < 5 ? "enero" : "julio";
      const monthsAway = (MONTHS.indexOf(target) - currentMonth + 12) % 12;

      if (monthsAway <= 4) {
        return {
          shouldWait: true,
          when: target,
          months: monthsAway,
          reason:
            "El calendario académico concentra las matrículas en " + target + ". Activar el " +
            "crédito educativo cerca de esa fecha evita pagar intereses por un desembolso " +
            "anticipado.",
          benefit:
            "Menos " + monthsAway + " " + (monthsAway === 1 ? "mes" : "meses") +
            " de intereses innecesarios",
        };
      }
    }

    // 3. Prima de servicios el mes próximo (mayo → junio, noviembre → diciembre).
    if ((currentMonth === 4 || currentMonth === 10) && stage.stage !== "Inicio laboral") {
      return {
        shouldWait: false,
        when: monthAhead(1),
        months: 1,
        reason:
          "La prima de " + (currentMonth === 4 ? "junio" : "diciembre") + " llega el próximo " +
          "mes: es el mejor momento para iniciar, con un abono inicial que reduce la cuota de " +
          "todo el plazo.",
        benefit: "Cuota menor durante todo el crédito",
      };
    }

    return {
      shouldWait: false,
      when: null,
      months: 0,
      reason:
        "Las señales indican que este es el momento adecuado: la necesidad está activa y la " +
        "capacidad disponible.",
      benefit: null,
    };
  }

  /**
   * Ventana de contacto: día de la semana y hora derivados de la cédula.
   * Estable para una misma persona, como el resto del perfil.
   */
  function contactSlot(id) {
    const days = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
    const hours = ["7:30 a.m.", "12:30 p.m.", "6:45 p.m.", "7:30 p.m."];
    return days[integer(id, "d", 0, 6)] + " " + hours[integer(id, "h", 0, 3)];
  }

  ORIGEN.domain.advanced.policy = { assessEligibility, findWindow, contactSlot, MONTHS };
})(window.ORIGEN);
