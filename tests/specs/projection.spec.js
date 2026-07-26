/**
 * Proyección de bienestar y ventana de contacto
 * ---------------------------------------------------------------------------
 * Verifica que la proyección es coherente y, sobre todo, que la Ruta de
 * Bienestar es una consecuencia del modelo y no un caso especial: cuando la
 * política bloquea el desembolso, el camino de acompañamiento debe ganar.
 */
(function (ORIGEN, T) {
  "use strict";

  const { describe, it, expect } = T;
  const { projection, engagement } = ORIGEN.domain;

  describe("Proyección de bienestar", function () {
    it("cada escenario tiene 13 puntos: el mes 0 y doce meses más", function () {
      ORIGEN.domain.dataset.build().forEach(function (d) {
        expect(d.projection.now.length).toBe(13);
        expect(d.projection.wait.length).toBe(13);
        expect(d.projection.route.length).toBe(13);
      });
    });

    it("los tres escenarios parten del mismo bienestar de hoy", function () {
      // Si partieran de valores distintos, comparar los finales no diría nada.
      ORIGEN.domain.dataset.build().forEach(function (d) {
        const start = d.projection.start;
        expect(d.projection.wait[0]).toBeCloseTo(start, 0.001, d.affiliate.id);
        expect(d.projection.route[0]).toBeCloseTo(
          start - 1.5,
          0.001,
          d.affiliate.id + ": la ruta arranca con la inercia inicial"
        );
      });
    });

    it("el índice se mantiene siempre dentro de la escala 0–100", function () {
      ORIGEN.domain.dataset.build().forEach(function (d) {
        ["now", "wait", "route"].forEach(function (key) {
          d.projection[key].forEach(function (value, month) {
            expect(value).toBeGreaterThanOrEqual(0, d.affiliate.id + " " + key + " mes " + month);
            expect(value).toBeLessThanOrEqual(100, d.affiliate.id + " " + key + " mes " + month);
          });
        });
      });
    });

    it("gana el escenario con mejor bienestar a doce meses", function () {
      ORIGEN.domain.dataset.build().forEach(function (d) {
        const ends = {
          now: d.projection.endNow,
          wait: d.projection.endWait,
          route: d.projection.endRoute,
        };
        const best = Math.max(ends.now, ends.wait, ends.route);

        expect(ends[d.winningScenario]).toBe(
          best,
          d.affiliate.id + ": ganó «" + d.winningScenario + "» sin ser el mejor"
        );
      });
    });

    it("si la política bloquea el desembolso, gana la ruta de bienestar", function () {
      // La Ruta de Bienestar no es una excepción cosida a mano: emerge de
      // comparar caminos. Esta prueba es la que lo demuestra.
      const blocked = ORIGEN.domain.dataset.build().filter(function (d) {
        return d.policy.blocked;
      });

      expect(blocked.length).toBeGreaterThanOrEqual(1);

      blocked.forEach(function (d) {
        expect(d.winningScenario).toBe("route", d.affiliate.id + " está bloqueado");
        expect(d.verdict).toBe("no_viable", d.affiliate.id);
      });
    });

    it("el veredicto se corresponde con el escenario ganador", function () {
      const mapping = { route: "no_viable", wait: "mejor_momento" };

      ORIGEN.domain.dataset.build().forEach(function (d) {
        if (mapping[d.winningScenario]) {
          expect(d.verdict).toBe(mapping[d.winningScenario], d.affiliate.id);
        } else {
          expect(["viable", "viable_condiciones"].indexOf(d.verdict) !== -1).toBeTruthy(
            d.affiliate.id + " ganó «ahora» pero su veredicto es " + d.verdict
          );
        }
      });
    });

    it("ante empate prefiere no endeudar", function () {
      // Desempate declarado: acompañar > esperar > otorgar.
      expect(projection.winningScenario({ endNow: 50, endWait: 50, endRoute: 50 })).toBe("route");
      expect(projection.winningScenario({ endNow: 50, endWait: 50, endRoute: 40 })).toBe("wait");
      expect(projection.winningScenario({ endNow: 60, endWait: 50, endRoute: 40 })).toBe("now");
    });

    it("la confianza declarada se mantiene en su rango y baja en las negativas", function () {
      const { min, max, maxWhenNotViable } = ORIGEN.config.confidence;

      ORIGEN.domain.dataset.build().forEach(function (d) {
        expect(d.confidence).toBeGreaterThanOrEqual(min, d.affiliate.id);
        expect(d.confidence).toBeLessThanOrEqual(max, d.affiliate.id);

        if (d.verdict === "no_viable") {
          expect(d.confidence).toBeLessThanOrEqual(
            maxWhenNotViable,
            "una negativa nunca se declara con confianza alta"
          );
        }
      });
    });
  });

  describe("Ventana de contacto", function () {
    it("la matriz cubre 7 días × 18 horas y está normalizada", function () {
      const matrix = engagement.buildEngagementMatrix(2, 19, 1.8);

      expect(matrix.length).toBe(7);
      expect(matrix[0].length).toBe(18);

      const flat = [].concat.apply([], matrix);
      expect(Math.max.apply(null, flat)).toBeCloseTo(1, 1e-9, "el máximo debe ser exactamente 1");
      expect(Math.min.apply(null, flat)).toBeGreaterThanOrEqual(
        0,
        "ninguna franja puede ser negativa"
      );
    });

    it("el pico coincide con el día y la hora solicitados", function () {
      const matrix = engagement.buildEngagementMatrix(3, 20, 1.5);
      const peak = engagement.findPeak(matrix);

      expect(peak.day).toBe(3);
      expect(peak.hour).toBe(20);
    });

    it("la etiqueta describe una ventana de dos horas", function () {
      expect(engagement.formatWindow({ day: 1, hour: 19 })).toBe("Mar 19:00–21:00");
      expect(engagement.formatWindow({ day: 0, hour: 9 })).toBe("Lun 09:00–11:00");
    });

    it("una negativa se entrega siempre por asesor humano", function () {
      ORIGEN.domain.dataset.build().forEach(function (d) {
        if (d.verdict === "no_viable") {
          expect(d.channel).toBe("Asesor humano", d.affiliate.id);
        }
      });
    });

    it("los mayores de 55 nunca reciben notificación push", function () {
      ORIGEN.domain.dataset.build().forEach(function (d) {
        if (d.affiliate.age > 55) {
          expect(d.channel).notToContain("push", d.affiliate.id + " tiene " + d.affiliate.age);
        }
      });
    });
  });
})(window.ORIGEN, window.TestRunner);
