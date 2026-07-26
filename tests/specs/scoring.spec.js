/**
 * Deliberación del portafolio · Scorer aditivo
 * ---------------------------------------------------------------------------
 * Comprueba que el puntaje es explicable de verdad: que la suma de los aportes
 * es exactamente el total, y que el caso que aparece en el documento maestro se
 * reproduce en el código.
 */
(function (ORIGEN, T) {
  "use strict";

  const { describe, it, expect } = T;
  const { PRODUCT_ORDER } = ORIGEN.core.catalog;

  describe("Scorer aditivo", function () {
    it("evalúa las cinco líneas del portafolio", function () {
      expect(PRODUCT_ORDER.length).toBe(5);
    });

    it("el total de cada producto es la suma exacta de sus aportes", function () {
      // Es la propiedad que hace auditable el puntaje: un jurado puede sumar a
      // mano las barras y obtener el número que muestra la interfaz.
      const decisions = ORIGEN.domain.dataset.build();
      let checked = 0;

      decisions.forEach(function (d) {
        d.ranking.forEach(function (entry) {
          const sum = entry.parts.reduce(function (total, part) {
            return total + part.points;
          }, 0);
          expect(sum).toBe(entry.sum, "producto " + entry.product + " de " + d.affiliate.id);
          checked++;
        });
      });

      expect(checked).toBe(decisions.length * 5);
    });

    it("el ranking va de mayor a menor puntaje", function () {
      ORIGEN.domain.dataset.build().forEach(function (d) {
        for (let i = 1; i < d.ranking.length; i++) {
          expect(d.ranking[i - 1].sum).toBeGreaterThanOrEqual(
            d.ranking[i].sum,
            "ranking desordenado en " + d.affiliate.id
          );
        }
      });
    });

    it("reproduce el caso de María del documento maestro", function () {
      // Documento maestro, «Así piensa ORIGEN»: 65 / 54 / 52 / 37. Los
      // nombres cambiaron con el catálogo de 5 líneas, los puntajes no.
      const maria = ORIGEN.domain.dataset.build()[0];
      const top = maria.ranking.slice(0, 4).map(function (entry) {
        return entry.product + ":" + entry.sum;
      });

      expect(top).toEqual(["consumo:65", "mujeres:54", "cupo:52", "vivienda:37"]);
      expect(maria.ranking[0].sum - maria.ranking[1].sum).toBe(
        11,
        "el documento maestro dice que gana por 11 puntos"
      );
    });

    it("las señales del ganador están todas catalogadas con color", function () {
      // Una señal sin color en el catálogo se dibujaría con el color de reserva
      // y la explicación perdería legibilidad.
      const { SIGNAL_COLORS } = ORIGEN.core.catalog;

      ORIGEN.domain.dataset.build().forEach(function (d) {
        d.ranking[0].parts.forEach(function (part) {
          expect(Boolean(SIGNAL_COLORS[part.signal])).toBeTruthy(
            "señal sin color: «" + part.signal + "»"
          );
        });
      });
    });

    it("un afiliado con deuda externa costosa prioriza el crédito de consumo", function () {
      const decisions = ORIGEN.domain.dataset.build();
      const withCostlyDebt = decisions.filter(function (d) {
        return d.affiliate.externalDebt.count >= 3 && d.affiliate.externalDebt.annualRate >= 27;
      });

      expect(withCostlyDebt.length).toBeGreaterThanOrEqual(
        1,
        "la población debería incluir este caso"
      );

      withCostlyDebt.forEach(function (d) {
        expect(d.product).toBe(
          "consumo",
          d.affiliate.id + " tiene deuda externa costosa y debería priorizar consumo"
        );
      });
    });
  });
})(window.ORIGEN, window.TestRunner);
