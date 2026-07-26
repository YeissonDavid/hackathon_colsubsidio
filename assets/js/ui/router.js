/**
 * ORIGEN · Enrutador de vistas
 * ---------------------------------------------------------------------------
 * Una sola función sabe qué pantalla está activa y cómo pintarla. Las vistas no
 * se llaman entre sí: piden un cambio de ruta y el enrutador decide.
 *
 * Mantiene la ruta actual para poder repintar la pantalla en la que está el
 * usuario cuando cambia algo transversal —por ejemplo, el modo privacidad— sin
 * expulsarlo a otra vista.
 *
 * Dependencias: core/namespace.js, ui/dom.js, ui/views/*.js
 */
(function (ORIGEN) {
  "use strict";

  const { byId, all } = ORIGEN.ui.dom;

  /** Rutas de navegación principal, las que aparecen en la barra lateral. */
  const ROUTES = {
    bandeja: function (container) { ORIGEN.ui.views.inbox.render(container); },
    lote: function (container) { ORIGEN.ui.views.batch.render(container); },
    portafolio: function (container) { ORIGEN.ui.views.portfolio.render(container); },
    fuentes: function (container) { ORIGEN.ui.views.sources.render(container); },
    simulador: function (container) { ORIGEN.ui.views.simulator.render(container); },
    comparador: function (container) { ORIGEN.ui.views.comparator.render(container); },
    laboratorio: function (container) { ORIGEN.ui.views.lab.render(container); },
    reto: function (container) { ORIGEN.ui.views.challenge.render(container); },
    arquitectura: function (container) { ORIGEN.ui.views.architecture.render(container); },
  };

  /** Ruta activa: una clave de ROUTES o "ficha". */
  let current = "bandeja";

  /** Índice del afiliado abierto, cuando la ruta es "ficha". */
  let currentIndex = null;

  /** Marca el elemento de navegación activo, o ninguno en la ficha. */
  function highlightNav(route) {
    all(".navitem").forEach(function (item) {
      const isActive = item.dataset.view === route;
      if (isActive) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  }

  /** Devuelve el contenedor de vistas. */
  function container() {
    return byId("view");
  }

  /**
   * Navega a una de las rutas principales.
   * @param {string} route
   */
  function go(route) {
    if (!ROUTES[route]) return;

    // La simulación del lote debe detenerse al abandonar su vista.
    if (current === "lote" && route !== "lote") ORIGEN.ui.views.batch.teardown();

    current = route;
    currentIndex = null;

    highlightNav(route);
    ROUTES[route](container());

    byId("content").scrollTop = 0;
  }

  /**
   * Abre la ficha de un afiliado.
   * @param {number} index
   */
  function openAffiliate(index) {
    if (current === "lote") ORIGEN.ui.views.batch.teardown();

    current = "ficha";
    currentIndex = index;

    highlightNav(null);
    ORIGEN.ui.views.affiliate.render(container(), index);

    byId("content").scrollTop = 0;
  }

  /**
   * Vuelve a pintar la vista actual, conservando la pantalla y el afiliado.
   * Se usa cuando cambia el modo privacidad.
   */
  function refresh() {
    if (current === "ficha" && currentIndex !== null) {
      ORIGEN.ui.views.affiliate.render(container(), currentIndex);
    } else {
      ROUTES[current](container());
    }
  }

  /** Ruta activa. */
  function currentRoute() {
    return current;
  }

  /** Índice del afiliado abierto, o null. */
  function currentAffiliateIndex() {
    return currentIndex;
  }

  ORIGEN.ui.router = { go, openAffiliate, refresh, currentRoute, currentAffiliateIndex };
})(window.ORIGEN);
