/**
 * Formato y escape
 * ---------------------------------------------------------------------------
 * El escape de HTML se prueba porque es lo único que separa la interfaz de una
 * inyección cuando se conecten los feeds reales de Colsubsidio: hoy los nombres
 * son sintéticos, mañana serán entrada externa.
 */
(function (ORIGEN, T) {
  "use strict";

  const { describe, it, expect } = T;
  const { money, moneyShort, percent, escapeHtml, initials, term } = ORIGEN.core.format;

  describe("Formato", function () {
    it("presenta pesos colombianos con separador de miles y sin decimales", function () {
      expect(money(1234567)).toBe("$1.234.567");
      expect(money(1234567.89)).toBe("$1.234.568");
      expect(money(0)).toBe("$0");
    });

    it("abrevia montos en miles", function () {
      expect(moneyShort(1234567)).toBe("$1.235k");
    });

    it("presenta porcentajes con la precisión pedida", function () {
      expect(percent(0.2956)).toBe("29.6");
      expect(percent(0.32, 0)).toBe("32");
    });

    it("expresa el plazo en meses hasta 60 y en años por encima", function () {
      expect(term(24)).toBe("24 meses");
      expect(term(60)).toBe("60 meses");
      expect(term(180)).toBe("15 años");
    });
  });

  describe("Escape de HTML", function () {
    it("neutraliza las etiquetas y los atributos", function () {
      expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
        "&lt;img src=x onerror=alert(1)&gt;"
      );
      expect(escapeHtml('"><script>')).toBe("&quot;&gt;&lt;script&gt;");
      expect(escapeHtml("O'Brien & hijos")).toBe("O&#39;Brien &amp; hijos");
    });

    it("no altera el texto que no necesita escape", function () {
      expect(escapeHtml("María Gómez Rojas")).toBe("María Gómez Rojas");
      expect(escapeHtml("CC 52.114.883")).toBe("CC 52.114.883");
    });
  });

  describe("Iniciales", function () {
    it("toma la primera letra de los dos primeros nombres", function () {
      expect(initials("María Gómez Rojas")).toBe("MG");
    });

    it("tolera un nombre de una sola palabra", function () {
      // La versión anterior asumía siempre dos palabras y lanzaba TypeError.
      expect(initials("Prince")).toBe("P");
    });

    it("tolera espacios de más y nombres vacíos", function () {
      expect(initials("  Ana   Torres  ")).toBe("AT");
      expect(initials("")).toBe("—");
    });

    it("nunca falla con ningún nombre de la población", function () {
      ORIGEN.domain.dataset.build().forEach(function (d) {
        const value = initials(d.affiliate.name);
        expect(value.length).toBeGreaterThanOrEqual(1, d.affiliate.name);
      });
    });
  });
})(window.ORIGEN, window.TestRunner);
