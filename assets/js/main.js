/**
 * ORIGEN · Arranque
 * ---------------------------------------------------------------------------
 * Único punto de entrada. Construye el conjunto de decisiones, registra los
 * escuchas de eventos y pinta la primera vista.
 *
 * Todos los eventos se registran por DELEGACIÓN sobre contenedores estables
 * (`#view`, `.rail`, `.topbar`). Las vistas se repintan por completo con
 * `innerHTML`, así que no se puede enlazar nada a elementos concretos: los
 * escuchas viven en los contenedores, que nunca se destruyen.
 *
 * Dependencias: todos los módulos anteriores.
 */
(function (ORIGEN) {
  "use strict";

  const { byId, one, delegate } = ORIGEN.ui.dom;

  /** Enlaza la barra lateral. */
  function bindNavigation() {
    delegate(one(".rail"), "click", ".navitem", function (event, item) {
      ORIGEN.ui.router.go(item.dataset.view);
    });
  }

  /** Enlaza el buscador de cédula o nombre. */
  function bindFinder() {
    const finder = byId("finder");

    finder.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;

      const query = finder.value.trim();
      if (!query) return;

      const hit = ORIGEN.domain.dataset.find(query);

      if (hit) {
        ORIGEN.ui.router.openAffiliate(hit.index);
        finder.blur();
      } else {
        ORIGEN.ui.toast.show(
          "Sin coincidencias",
          "No se encontró una cédula o nombre que coincida en la bandeja actual.",
          true
        );
      }
    });
  }

  /**
   * Enlaza el interruptor de enmascaramiento de PII.
   * Al cambiar, se repinta la vista ACTUAL, sea la que sea.
   */
  function bindPrivacyToggle() {
    const toggle = byId("privacy-toggle");

    toggle.checked = ORIGEN.ui.privacy.isEnabled();
    toggle.addEventListener("change", function () {
      ORIGEN.ui.privacy.setEnabled(toggle.checked);
    });

    ORIGEN.ui.privacy.onChange(function () {
      ORIGEN.ui.router.refresh();
    });
  }

  /**
   * Enlaza todo lo que ocurre dentro del contenedor de vistas: filtros, filas
   * de la tabla, botones de acción y saltos de navegación.
   */
  function bindViewInteractions() {
    const view = byId("view");

    // Navegación desde dentro de una vista (botón «Procesar lote», «← Bandeja»).
    delegate(view, "click", "[data-goto]", function (event, target) {
      ORIGEN.ui.router.go(target.dataset.goto);
    });

    // Filtros de la bandeja.
    delegate(view, "click", "[data-filter]", function (event, target) {
      if (ORIGEN.ui.views.inbox.setFilter(target.dataset.filter)) {
        ORIGEN.ui.router.refresh();
      }
    });

    // Abrir una ficha: con clic o con Enter sobre la fila.
    delegate(view, "click", "tbody tr[data-index]", function (event, row) {
      ORIGEN.ui.router.openAffiliate(Number(row.dataset.index));
    });

    delegate(view, "keydown", "tbody tr[data-index]", function (event, row) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        ORIGEN.ui.router.openAffiliate(Number(row.dataset.index));
      }
    });

    // Acciones sobre la resolución de la ficha abierta.
    delegate(view, "click", "[data-act]", function (event, button) {
      const index = ORIGEN.ui.router.currentAffiliateIndex();
      if (index === null) return;

      const result = ORIGEN.ui.views.affiliate.applyAction(index, button.dataset.act);
      ORIGEN.ui.toast.show(result.title, result.detail, result.isRisk);
    });

    // Acciones de vista que solo confirman con un aviso.
    delegate(view, "click", "[data-action]", function (event, button) {
      const { toast } = ORIGEN.ui;

      switch (button.dataset.action) {
        case "export":
          toast.show(
            "Exportación generada",
            "Bandeja completa en CSV, con trazabilidad de fuentes por afiliado."
          );
          break;
        case "load":
          toast.show("Archivo de cédulas", "El motor acepta lotes de 10 a 2.000 cédulas en CSV.");
          break;
        case "run":
          ORIGEN.ui.views.batch.run();
          break;
        case "revocations":
          toast.show(
            "Registro de revocaciones",
            "Sin revocaciones activas en el periodo consultado."
          );
          break;
      }
    });
  }

  /** Arranca la aplicación. */
  function start() {
    const decisions = ORIGEN.domain.dataset.build();

    byId("nav-bandeja-count").textContent = decisions.length;

    bindNavigation();
    bindFinder();
    bindPrivacyToggle();
    bindViewInteractions();

    ORIGEN.ui.router.go("bandeja");
  }

  // Los scripts van al final del <body>, así que el DOM ya está disponible;
  // se comprueba de todos modos para que el orden de carga no sea una
  // suposición implícita.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window.ORIGEN);
