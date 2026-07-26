/**
 * Criterio de aceptación 2 · Determinismo
 * ---------------------------------------------------------------------------
 * «Para el mismo perfil con las mismas variables de entrada, el sistema
 * SIEMPRE debe arrojar exactamente el mismo puntaje, producto sugerido y
 * proyección a 12 meses.»
 *
 * Esta es la prueba que el jurado puede pedir que se ejecute delante suyo.
 */
(function (ORIGEN, T) {
  "use strict";

  const { describe, it, expect } = T;

  /** Huella comparable de una decisión. */
  function fingerprint(d) {
    return [
      d.affiliate.id,
      d.product,
      d.verdict,
      Math.round(d.amount),
      Math.round(d.installment),
      d.ranking[0].sum,
      Math.round(d.projection.endNow * 1000),
      Math.round(d.projection.endWait * 1000),
      Math.round(d.projection.endRoute * 1000),
      d.contactWindowLabel,
      d.channel,
    ].join("|");
  }

  describe("Determinismo", function () {
    it("dos construcciones con la misma semilla dan resultados idénticos", function () {
      const first = ORIGEN.domain.dataset.build().map(fingerprint).join("\n");
      const second = ORIGEN.domain.dataset.build().map(fingerprint).join("\n");

      expect(second).toBe(first, "la población debe ser reproducible en cada carga");
    });

    it("la población tiene el tamaño declarado: 3 perfiles demo + sintéticos", function () {
      const expected = 3 + ORIGEN.config.SYNTHETIC_POPULATION;
      expect(ORIGEN.domain.dataset.build().length).toBe(expected);
    });

    it("una semilla distinta produce una población distinta", function () {
      const withSeed = ORIGEN.domain.dataset.build(12345).map(fingerprint).join("\n");
      const original = ORIGEN.domain.dataset.build().map(fingerprint).join("\n");

      expect(withSeed === original).toBeFalsy(
        "si cambiar la semilla no cambia nada, el generador no está sembrado"
      );
    });

    it("los tres perfiles demo no dependen de la semilla", function () {
      // Son literales escritos a mano: deben sobrevivir a cualquier cambio del
      // generador, porque son los que se citan en el pitch.
      const alternative = ORIGEN.domain.dataset.build(999);
      const demoIds = alternative.slice(0, 3).map(function (d) {
        return d.affiliate.id;
      });

      expect(demoIds).toEqual(["CC 52.114.883", "CC 1.020.774.551", "CC 1.007.559.310"]);

      ORIGEN.domain.dataset.build(); // restaura la semilla de la aplicación
    });

    it("el generador pseudoaleatorio es estable para una semilla dada", function () {
      const a = ORIGEN.core.createRandom(42);
      const b = ORIGEN.core.createRandom(42);
      const sequenceA = [a.next(), a.next(), a.next()];
      const sequenceB = [b.next(), b.next(), b.next()];

      expect(sequenceA).toEqual(sequenceB);
    });
  });
})(window.ORIGEN, window.TestRunner);
