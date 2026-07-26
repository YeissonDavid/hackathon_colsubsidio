/**
 * Motor avanzado y laboratorio de evidencia
 * ---------------------------------------------------------------------------
 * El motor avanzado tiene una propiedad de determinismo distinta a la del base:
 * deriva cada atributo de un hash de la cédula, así que cada valor es
 * independiente del resto. Esta suite verifica esa propiedad, la política de
 * viabilidad y que apagar fuentes degrade la decisión — que es el argumento
 * central del simulador.
 */
(function (ORIGEN, T) {
  "use strict";

  const { describe, it, expect } = T;
  const advanced = ORIGEN.domain.advanced;

  /** Cédulas de demostración, las que se citan en el pitch. */
  const MARIA = "10000053";
  const ANDRES = "10000325";
  const CARLOS = "10000087";

  function decide(id, sources) {
    return advanced.decide(id, null, sources || advanced.sources.allEnabled());
  }

  describe("Motor avanzado · determinismo por hash", function () {
    it("la misma cédula devuelve siempre la misma decisión", function () {
      const first = decide(MARIA);
      const second = decide(MARIA);

      expect(second.best.product).toBe(first.best.product);
      expect(second.confidence).toBe(first.confidence);
      expect(second.stage.stage).toBe(first.stage.stage);
      expect(second.eligibility.status).toBe(first.eligibility.status);
    });

    it("cédulas distintas producen perfiles distintos", function () {
      const a = decide(MARIA);
      const b = decide(ANDRES);

      expect(a.profile.age === b.profile.age && a.profile.income === b.profile.income).toBeFalsy(
        "dos cédulas no deberían generar el mismo perfil"
      );
    });

    it("el hash es estable e independiente del orden de consulta", function () {
      // Es la ventaja sobre el motor base: pedir un atributo no desplaza a los
      // demás, así que se puede añadir uno nuevo sin romper los existentes.
      const before = advanced.derive.unit(MARIA, "edad");
      advanced.derive.unit(MARIA, "otro-atributo-cualquiera");
      advanced.derive.integer(MARIA, "y-otro", 0, 100);
      const after = advanced.derive.unit(MARIA, "edad");

      expect(after).toBe(before);
    });

    it("los valores derivados caen en el rango pedido", function () {
      for (let i = 0; i < 200; i++) {
        const id = String(10000000 + i * 37);
        const value = advanced.derive.unit(id, "x");
        expect(value).toBeGreaterThanOrEqual(0, id);
        expect(value).toBeLessThanOrEqual(1, id);

        const integer = advanced.derive.integer(id, "y", 5, 9);
        expect(integer).toBeGreaterThanOrEqual(5, id);
        expect(integer).toBeLessThanOrEqual(9, id);
      }
    });

    it("la caché de perfiles no altera el resultado", function () {
      const cached = decide(MARIA);
      advanced.profile.clearCache();
      const cold = decide(MARIA);

      expect(cold.best.product).toBe(cached.best.product);
      expect(cold.confidence).toBe(cached.confidence);
      expect(JSON.stringify(cold.profile)).toBe(JSON.stringify(cached.profile));
    });
  });

  describe("Motor avanzado · perfiles de demostración", function () {
    it("María recibe crédito de consumo para ordenar su deuda", function () {
      const decision = decide(MARIA);
      expect(decision.best.product).toBe("Crédito de consumo");
      // Puede ser viable o «mejor momento después»: nunca una negativa.
      expect(decision.eligibility.status === "no").toBeFalsy();
    });

    it("Carlos no es viable y se le ofrece la ruta de fortalecimiento", function () {
      const decision = decide(CARLOS);
      expect(decision.eligibility.status).toBe("no");
      expect(decision.best.product).toBe("Ruta de fortalecimiento");
      expect(decision.delivery.channel).toBe("Asesor humano");
      expect(decision.eligibility.reasons.length).toBeGreaterThanOrEqual(
        1,
        "una negativa siempre debe declarar su motivo"
      );
    });

    it("una negativa nunca se entrega por un canal automático", function () {
      for (let i = 0; i < 150; i++) {
        const decision = decide(String(10000000 + i * 613));
        if (decision.eligibility.status === "no") {
          expect(decision.delivery.kind).toBe("advisor", decision.profile.id);
        }
      }
    });
  });

  describe("Motor avanzado · política", function () {
    it("exige 2 meses de empleo con contrato indefinido y 6 en el resto", function () {
      for (let i = 0; i < 150; i++) {
        const decision = decide(String(10000000 + i * 431));
        const expected = decision.profile.isPermanent ? 2 : 6;
        expect(decision.eligibility.requiredMonths).toBe(expected, decision.profile.id);
      }
    });

    it("la cuota máxima nunca es negativa", function () {
      for (let i = 0; i < 150; i++) {
        const decision = decide(String(10000000 + i * 797));
        expect(decision.eligibility.maxInstallment).toBeGreaterThanOrEqual(0, decision.profile.id);
      }
    });

    it("los puntajes de las alternativas van de mayor a menor", function () {
      for (let i = 0; i < 60; i++) {
        const decision = decide(String(10000000 + i * 1009));
        for (let k = 1; k < decision.alternatives.length; k++) {
          expect(decision.alternatives[k - 1].score).toBeGreaterThanOrEqual(
            decision.alternatives[k].score,
            decision.profile.id
          );
        }
      }
    });

    it("todo producto descartado explica por qué", function () {
      for (let i = 0; i < 60; i++) {
        const decision = decide(String(10000000 + i * 227));
        decision.alternatives.slice(1).forEach(function (alternative) {
          const explains = Boolean(alternative.description) || Boolean(alternative.dismissal);
          expect(explains).toBeTruthy(
            decision.profile.id + " · " + alternative.product + " sin explicación"
          );
        });
      }
    });

    it("la etapa de vida siempre trae su política completa", function () {
      for (let i = 0; i < 100; i++) {
        const decision = decide(String(10000000 + i * 353));
        const stage = decision.stage;

        expect(advanced.lifestage.STAGES.indexOf(stage.stage) !== -1).toBeTruthy(stage.stage);
        expect(stage.index).toBeGreaterThanOrEqual(0, stage.stage);
        expect(stage.installmentTolerance).toBeGreaterThanOrEqual(0.22, stage.stage);
        expect(stage.installmentTolerance).toBeLessThanOrEqual(0.32, stage.stage);
        expect(Boolean(stage.reason)).toBeTruthy("la etapa debe explicarse");
      }
    });
  });

  describe("Motor avanzado · valor de las fuentes exógenas", function () {
    it("apagar las centrales de información baja la confianza", function () {
      // Es el argumento del simulador: sin buró el motor sabe menos, y lo dice.
      const withBureau = decide(MARIA);
      const withoutBureau = decide(MARIA, Object.assign(advanced.sources.allEnabled(), {
        bureau: false,
      }));

      expect(withoutBureau.confidence).toBeLessThanOrEqual(
        withBureau.confidence,
        "sin centrales la confianza no puede subir"
      );
      expect(withoutBureau.confidence === withBureau.confidence).toBeFalsy(
        "apagar la fuente más pesada debe notarse"
      );
    });

    it("una fuente apagada devuelve «no se sabe», no un cero", function () {
      // La distinción importa: «sin deuda externa» no es lo mismo que «no
      // consultamos la central».
      const decision = decide(MARIA, Object.assign(advanced.sources.allEnabled(), {
        bureau: false,
        alt: false,
      }));

      expect(decision.profile.obligations).toBe(null);
      expect(decision.profile.regularIncomeMonths).toBe(null);
    });

    it("sin consentimiento de canal no se usa ningún canal digital", function () {
      const decision = decide(ANDRES, Object.assign(advanced.sources.allEnabled(), {
        cont: false,
      }));

      expect(decision.delivery.kind).toBe("advisor");
    });

    it("las señales suman 100 puntos y se reparten sobre las disponibles", function () {
      const full = decide(MARIA);
      const reduced = decide(MARIA, Object.assign(advanced.sources.allEnabled(), {
        bureau: false,
        pub: false,
      }));

      expect(reduced.signals.length).toBeLessThanOrEqual(
        full.signals.length - 2,
        "apagar dos fuentes debe retirar sus señales"
      );

      [full, reduced].forEach(function (decision) {
        const total = decision.signals.reduce(function (sum, signal) {
          return sum + signal.weight;
        }, 0);
        expect(total).toBeCloseTo(100, 1.5, "el reparto debe sumar ~100");
      });
    });
  });

  describe("Laboratorio de evidencia", function () {
    // Muestra pequeña: la suite debe seguir siendo instantánea.
    const SIZE = 400;
    let result = null;

    function report() {
      if (!result) result = ORIGEN.domain.lab.run(SIZE);
      return result;
    }

    it("los cuatro cuadrantes suman la población completa", function () {
      const r = report();
      const sum =
        r.common.count + r.protected.count + r.included.count + r.neitherApproves.count;

      expect(sum).toBe(SIZE, "cada afiliado cae en exactamente un cuadrante");
    });

    it("la protección concentra más mora que la inclusión", function () {
      // Es el resultado que sostiene la tesis: ORIGEN frena a quien iba a caer y
      // aprueba a quien no. Si esto se invirtiera, el motor discriminaría al revés.
      const r = report();
      const protectedRate = r.protected.count ? r.protected.defaults / r.protected.count : 0;
      const includedRate = r.included.count ? r.included.defaults / r.included.count : 0;

      expect(protectedRate).toBeGreaterThanOrEqual(
        includedRate,
        "los protegidos deberían tener peor mora real que los incluidos"
      );
    });

    it("ORIGEN acierta la necesidad real más que la línea base", function () {
      const r = report();
      const origen = r.origen.approved ? r.origen.relevant / r.origen.approved : 0;
      const baseline = r.baseline.approved ? r.baseline.relevant / r.baseline.approved : 0;

      expect(origen).toBeGreaterThanOrEqual(baseline, "la pertinencia debe mejorar");
    });

    it("el estudio de ablación cubre las cuatro fuentes exógenas más el total", function () {
      const r = report();
      const scenarios = Object.keys(r.ablation);

      expect(scenarios.length).toBe(5);
      expect(scenarios.indexOf("completa") !== -1).toBeTruthy();
      expect(scenarios.indexOf("sin centrales") !== -1).toBeTruthy();
    });

    it("quitar las centrales degrada la cartera proyectada", function () {
      const r = report();
      expect(r.ablation["sin centrales"].defaultRate).toBeGreaterThanOrEqual(
        r.ablation.completa.defaultRate,
        "sin buró la mora proyectada no puede bajar"
      );
      expect(r.ablation["sin centrales"].confidence).toBeLessThanOrEqual(
        r.ablation.completa.confidence,
        "sin buró el DCI medio no puede subir"
      );
    });

    it("la verdad simulada es estable para una misma cédula", function () {
      const a = ORIGEN.domain.lab.groundTruth(MARIA);
      const b = ORIGEN.domain.lab.groundTruth(MARIA);

      expect(b.defaults).toBe(a.defaults);
      expect(b.need).toBe(a.need);
    });

    it("cada necesidad tiene un producto que la responde", function () {
      const mapping = ORIGEN.domain.lab.NEED_TO_PRODUCT;

      for (let i = 0; i < 120; i++) {
        const truth = ORIGEN.domain.lab.groundTruth(String(10000000 + i * 541));
        expect(Boolean(mapping[truth.need])).toBeTruthy("necesidad sin producto: " + truth.need);
      }
    });
  });
})(window.ORIGEN, window.TestRunner);
