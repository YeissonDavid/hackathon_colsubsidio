/**
 * ORIGEN · Ejecutor de pruebas en consola
 * ---------------------------------------------------------------------------
 * Mismas pruebas que tests/index.html, en terminal, para poder integrarlas en
 * un gancho de pre-commit o en CI:
 *
 *     node tests/run-node.js
 *
 * Sale con código 1 si algo falla, que es lo que un pipeline necesita. No
 * requiere instalar nada: usa el módulo `vm` de la biblioteca estándar para
 * cargar los mismos archivos que carga el navegador, en el mismo orden.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

/** Motor bajo prueba, en orden de dependencias. Espeja index.html. */
const ENGINE = [
  "assets/js/core/namespace.js",
  "assets/js/core/config.js",
  "assets/js/core/math.js",
  "assets/js/core/random.js",
  "assets/js/core/format.js",
  "assets/js/core/catalog.js",
  "assets/js/domain/lifestage.js",
  "assets/js/domain/engagement.js",
  "assets/js/domain/population.js",
  "assets/js/domain/scoring.js",
  "assets/js/domain/capacity.js",
  "assets/js/domain/projection.js",
  "assets/js/domain/narrative.js",
  "assets/js/domain/decision.js",
  "assets/js/domain/dataset.js",
  "assets/js/domain/advanced/hash.js",
  "assets/js/domain/advanced/sources.js",
  "assets/js/domain/advanced/profile.js",
  "assets/js/domain/advanced/lifestage.js",
  "assets/js/domain/advanced/policy.js",
  "assets/js/domain/advanced/deliberation.js",
  "assets/js/domain/advanced/delivery.js",
  "assets/js/domain/advanced/engine.js",
  "assets/js/domain/lab.js",
  "assets/js/ui/privacy.js",
];

const SPECS = [
  "tests/runner.js",
  "tests/specs/determinism.spec.js",
  "tests/specs/scoring.spec.js",
  "tests/specs/capacity.spec.js",
  "tests/specs/projection.spec.js",
  "tests/specs/privacy.spec.js",
  "tests/specs/format.spec.js",
  "tests/specs/advanced.spec.js",
];

// `window` apunta al propio sandbox: los módulos usan `window.ORIGEN` y no
// distinguen entre navegador y consola.
const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);

for (const file of ENGINE.concat(SPECS)) {
  const code = fs.readFileSync(path.join(ROOT, file), "utf8");
  try {
    vm.runInContext(code, sandbox, { filename: file });
  } catch (error) {
    console.error("No se pudo cargar " + file + ": " + error.message);
    process.exit(1);
  }
}

const report = sandbox.TestRunner.run();
const total = report.passed + report.failed;

const GREEN = "[32m";
const RED = "[31m";
const DIM = "[2m";
const RESET = "[0m";

report.results.forEach(function (suite) {
  console.log("\n" + suite.name);
  suite.tests.forEach(function (test) {
    if (test.ok) {
      console.log("  " + GREEN + "✓" + RESET + " " + DIM + test.name + RESET);
    } else {
      console.log("  " + RED + "✕ " + test.name + RESET);
      console.log("      " + test.error);
    }
  });
});

console.log(
  "\n" + (report.failed === 0 ? GREEN + "✓ Todo en verde" : RED + "✕ " + report.failed + " fallando") +
    RESET + " · " + report.passed + " de " + total + " correctas\n"
);

process.exit(report.failed === 0 ? 0 : 1);
