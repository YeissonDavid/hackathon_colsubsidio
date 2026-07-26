/**
 * ORIGEN · Vista «Cumplimiento del reto»
 * ---------------------------------------------------------------------------
 * Mapea la solución contra los cuatro objetivos del reto de Colsubsidio.
 *
 * Existe para que el jurado no tenga que reconstruir la correspondencia: cada
 * exigencia del enunciado tiene aquí su respuesta y el sitio donde verla.
 *
 * Contenido estático, sin lógica: es material de pitch dentro de la aplicación.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  /** Cita del enunciado del reto. */
  const BRIEF =
    "El reto no es conocer al afiliado; el reto es demostrar que podemos convertir ese " +
    "conocimiento en la oferta correcta, en el momento correcto y por el canal correcto. " +
    "Proponer, comunicar y garantizar la maximización de colocación de créditos en 2 minutos " +
    "sin ir a una oficina.";

  /** Los cuatro objetivos, con cómo los cumple ORIGEN y dónde comprobarlo. */
  const OBJECTIVES = [
    {
      title: "1. La oferta correcta",
      lead: "Motor multiparamétrico",
      accent: "accent",
      body:
        "Se analizan huella transaccional, etapa de vida y capacidad financiera para proponer " +
        "el producto exacto, con monto y plazo ajustados a la capacidad real. El monto se " +
        "calcula después del tope de cuota, nunca antes: por construcción no puede " +
        "sobreendeudar.",
      where: "Bandeja de decisión · Simulador interactivo",
    },
    {
      title: "2. El momento correcto",
      lead: "Proyección a 12 meses",
      accent: "info",
      body:
        "No se evalúa solo el presente. Se proyectan tres caminos —otorgar, esperar, " +
        "acompañar— y gana el que deja mejor al afiliado. De ahí sale el veredicto «viable, " +
        "pero mejor después»: el motor puede recomendar esperar a que se libere capacidad.",
      where: "Ficha del afiliado · gráfico de proyección",
    },
    {
      title: "3. El canal correcto",
      lead: "Decisión omnicanal",
      accent: "ok",
      body:
        "El canal se elige por preferencia declarada y consentimiento, no por conveniencia: " +
        "WhatsApp para contacto directo, correo para trámites largos, push para intención " +
        "reciente, y asesor humano siempre que la respuesta es negativa. Un mapa de calor de " +
        "7 días × 18 horas fija la franja de mayor conexión.",
      where: "Ficha del afiliado · ventana de contacto",
    },
    {
      title: "4. Dos minutos y cero oficinas",
      lead: "Hiperpersonalización automática",
      accent: "lifestage",
      body:
        "El motor determinístico pre-calcula, pre-aprueba y estructura la oferta al instante. " +
        "El afiliado recibe una propuesta lista para firmar en digital, con la tasa, el seguro " +
        "y la cuota final a la vista.",
      where: "Simulador · mockup de cierre en la app",
    },
  ];

  function render(container) {
    container.innerHTML =
      '<div class="phead"><div><h1>Cumplimiento del reto</h1>' +
      '<div class="phead__sub">Alineación de ORIGEN con los objetivos de la Hackathon ' +
      "Colsubsidio y 30X.</div></div></div>" +

      '<div class="card"><div class="card__head"><h3>El desafío</h3>' +
      '<span class="card__hint">Enunciado</span></div>' +
      '<div class="card__body">' +
      '<blockquote class="brief">' + BRIEF + "</blockquote>" +
      '<img class="brief__image" src="assets/img/reto_referencia.jpg"' +
      ' alt="Lámina de referencia del reto de crédito hiperpersonalizado" loading="lazy">' +
      "</div></div>" +

      '<div class="batchgrid">' +
      OBJECTIVES.map(function (objective) {
        return (
          '<div class="card"><div class="card__head"><h3>' + objective.title + "</h3></div>" +
          '<div class="card__body objective">' +
          '<strong class="objective__lead objective__lead--' + objective.accent + '">' +
          objective.lead + ":</strong> " + objective.body +
          '<div class="objective__where">Dónde verlo: ' + objective.where + "</div>" +
          "</div></div>"
        );
      }).join("") +
      "</div>";
  }

  ORIGEN.ui.views = ORIGEN.ui.views || {};
  ORIGEN.ui.views.challenge = { render };
})(window.ORIGEN);
