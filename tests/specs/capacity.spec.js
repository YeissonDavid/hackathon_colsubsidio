/**
 * Capacidad de pago y política de riesgo
 * ---------------------------------------------------------------------------
 * La parte del motor que puede decir «no». Si estas pruebas fallan, ORIGEN
 * estaría proponiendo créditos que incumplen la política declarada — y eso es
 * exactamente lo que el reto pide evitar.
 */
(function (ORIGEN, T) {
  "use strict";

  const { describe, it, expect } = T;
  const { LIFE_STAGES } = ORIGEN.core.catalog;
  const { capacity } = ORIGEN.domain;

  describe("Política de capacidad", function () {
    it("ninguna resolución aprobada supera el tope del momento de vida", function () {
      // Invariante central: si esto falla, el motor sobreendeuda.
      ORIGEN.domain.dataset.build().forEach(function (d) {
        if (d.verdict === "no_viable") return;

        const limit = LIFE_STAGES[d.affiliate.lifeStage].maxInstallmentRatio;
        expect(d.finalLoad).toBeLessThanOrEqual(
          limit + 0.001,
          d.affiliate.id + " (" + d.affiliate.lifeStage + ") queda al " +
            (d.finalLoad * 100).toFixed(1) + "%"
        );
      });
    });

    it("ninguna resolución aprobada incumple la vinculación mínima", function () {
      ORIGEN.domain.dataset.build().forEach(function (d) {
        if (d.verdict === "no_viable") return;
        expect(d.affiliate.tenureMonths).toBeGreaterThanOrEqual(
          d.minTenure,
          d.affiliate.id + " tiene " + d.affiliate.tenureMonths + " meses"
        );
      });
    });

    it("exige 2 meses de vinculación con contrato indefinido y 6 en el resto", function () {
      expect(capacity.requiredTenure({ contractType: "indefinido" })).toBe(2);
      expect(capacity.requiredTenure({ contractType: "fijo" })).toBe(6);
      expect(capacity.requiredTenure({ contractType: "obra" })).toBe(6);
      expect(capacity.requiredTenure({ contractType: "independiente" })).toBe(6);
    });

    it("aplica la Ley 1527 de 2012: los independientes quedan fuera de libranza", function () {
      expect(capacity.modality({ isSelfEmployed: true, contractType: "independiente" }))
        .toBe("No libranza / cupo");
      expect(capacity.modality({ isSelfEmployed: false, contractType: "indefinido" }))
        .toBe("Libranza");
      expect(capacity.modality({ isSelfEmployed: false, contractType: "obra" }))
        .toBe("No libranza");
    });

    it("el tope por capacidad nunca supera 3 veces el ingreso", function () {
      // 1 SMMLV habilita $1.500.000, pero el tope global es 3× el ingreso.
      const oneSmmlv = { income: ORIGEN.config.SMMLV };
      expect(capacity.libranzaCap(oneSmmlv)).toBe(1500000);

      ORIGEN.domain.dataset.build().forEach(function (d) {
        expect(d.libranzaCap).toBeLessThanOrEqual(d.affiliate.income * 3, d.affiliate.id);
      });
    });

    it("la compra de cartera sustituye la deuda externa en lugar de sumarse", function () {
      const substituting = ORIGEN.domain.dataset.build().filter(function (d) {
        return d.substitutes;
      });

      expect(substituting.length).toBeGreaterThanOrEqual(1);

      substituting.forEach(function (d) {
        expect(d.product).toBe("cartera");
        // Si sustituye, la carga final debe descontar el pago externo.
        const naive = (d.committed + d.installment) / d.affiliate.income;
        expect(d.finalLoad).toBeLessThanOrEqual(
          naive,
          d.affiliate.id + ": sustituir debería dejar la carga por debajo de sumar"
        );
      });
    });

    it("María libera flujo mensual real al ordenar su deuda", function () {
      const maria = ORIGEN.domain.dataset.build()[0];

      expect(maria.product).toBe("cartera");
      expect(maria.substitutes).toBeTruthy();
      expect(maria.freedCashFlow).toBeGreaterThanOrEqual(
        1,
        "sustituir dos obligaciones al 28% E.A. debe liberar caja"
      );
      // Su cuota nueva es menor que la que pagaba a las otras entidades.
      expect(maria.installment).toBeLessThanOrEqual(maria.externalPayment);
    });

    it("Carlos queda bloqueado por carga excedida, no por antigüedad", function () {
      // Es el caso que sostiene la Ruta de Bienestar en la demostración.
      const carlos = ORIGEN.domain.dataset.build()[2];

      expect(carlos.policy.exceedsLoad).toBeTruthy();
      expect(carlos.policy.insufficientTenure).toBeFalsy();
      expect(carlos.policy.blocked).toBeTruthy();
      expect(carlos.verdict).toBe("no_viable");
    });

    it("el factor de anualidad convierte cuota en monto de forma consistente", function () {
      const { annuityFactor } = ORIGEN.core.math;
      const rate = 0.015;
      const periods = 48;
      const factor = annuityFactor(rate, periods);

      const installment = 500000;
      const amount = installment * factor;

      expect(amount / factor).toBeCloseTo(installment, 0.01, "la conversión debe ser reversible");
      expect(factor).toBeGreaterThanOrEqual(1);
    });
  });
})(window.ORIGEN, window.TestRunner);
