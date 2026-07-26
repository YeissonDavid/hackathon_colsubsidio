/**
 * ORIGEN · Ejecutor de pruebas mínimo
 * ---------------------------------------------------------------------------
 * Un `describe`/`it`/`expect` en 80 líneas, sin dependencias. Existe por la
 * misma razón que el resto del proyecto: la solución debe poder verificarse
 * abriendo un archivo, sin instalar Node, npm ni un runner.
 *
 * Funciona igual en el navegador (tests/index.html) y en Node
 * (`node tests/run-node.js`).
 */
(function (global) {
  "use strict";

  const suites = [];
  let current = null;

  /** Agrupa pruebas relacionadas. */
  function describe(name, body) {
    current = { name, tests: [] };
    suites.push(current);
    body();
    current = null;
  }

  /** Declara una prueba. */
  function it(name, body) {
    if (!current) throw new Error("it() debe usarse dentro de describe()");
    current.tests.push({ name, body });
  }

  /** Aserciones. Mensaje de fallo siempre con valor esperado y obtenido. */
  function expect(actual) {
    return {
      toBe(expected, note) {
        if (actual !== expected) {
          fail("se esperaba " + format(expected) + " y se obtuvo " + format(actual), note);
        }
      },
      toEqual(expected, note) {
        const a = JSON.stringify(actual);
        const b = JSON.stringify(expected);
        if (a !== b) fail("se esperaba " + b + " y se obtuvo " + a, note);
      },
      toBeCloseTo(expected, tolerance, note) {
        const delta = Math.abs(actual - expected);
        if (!(delta <= tolerance)) {
          fail(
            "se esperaba " + expected + " ± " + tolerance + " y se obtuvo " + actual +
            " (desvío " + delta + ")",
            note
          );
        }
      },
      toBeLessThanOrEqual(limit, note) {
        if (!(actual <= limit)) fail(actual + " debería ser ≤ " + limit, note);
      },
      toBeGreaterThanOrEqual(limit, note) {
        if (!(actual >= limit)) fail(actual + " debería ser ≥ " + limit, note);
      },
      toBeTruthy(note) {
        if (!actual) fail("se esperaba un valor verdadero y se obtuvo " + format(actual), note);
      },
      toBeFalsy(note) {
        if (actual) fail("se esperaba un valor falso y se obtuvo " + format(actual), note);
      },
      toContain(needle, note) {
        if (String(actual).indexOf(needle) === -1) {
          fail("«" + needle + "» no aparece en " + format(actual), note);
        }
      },
      notToContain(needle, note) {
        if (String(actual).indexOf(needle) !== -1) {
          fail("«" + needle + "» no debería aparecer en " + format(actual), note);
        }
      },
    };
  }

  function format(value) {
    if (typeof value === "string") return '"' + value + '"';
    return String(value);
  }

  function fail(message, note) {
    throw new Error(note ? message + " — " + note : message);
  }

  /**
   * Ejecuta todas las suites.
   * @returns {{passed: number, failed: number, results: object[]}}
   */
  function run() {
    const results = [];
    let passed = 0;
    let failed = 0;

    suites.forEach(function (suite) {
      const suiteResult = { name: suite.name, tests: [] };

      suite.tests.forEach(function (test) {
        try {
          test.body();
          suiteResult.tests.push({ name: test.name, ok: true });
          passed++;
        } catch (error) {
          suiteResult.tests.push({ name: test.name, ok: false, error: error.message });
          failed++;
        }
      });

      results.push(suiteResult);
    });

    return { passed, failed, results };
  }

  global.TestRunner = { describe, it, expect, run };
})(typeof window !== "undefined" ? window : globalThis);
