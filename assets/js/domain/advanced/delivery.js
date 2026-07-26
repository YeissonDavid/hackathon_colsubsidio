/**
 * ORIGEN · Motor avanzado — entrega y redacción
 * ---------------------------------------------------------------------------
 * Cómo llega la oferta y qué dice.
 *
 * `selectDelivery` elige canal según preferencia declarada y consentimiento —
 * no según lo que le convenga a la Caja. Sin consentimiento de canal, no hay
 * canal digital: se pasa a asesor telefónico. Y una negativa nunca se entrega
 * por un canal automático.
 *
 * `compose` redacta en segunda persona, con la causa concreta delante. Es un
 * generador de plantillas, no un LLM: determinístico y auditable. Sustituirlo
 * por un modelo de lenguaje es cambiar este archivo y nada más.
 *
 * Dependencias: core/namespace.js, core/format.js, domain/advanced/policy.js
 */
(function (ORIGEN) {
  "use strict";

  /** Umbral de actividad digital para preferir la notificación en la app. */
  const APP_ENGAGEMENT_THRESHOLD = 45;

  /**
   * Elige canal, momento y justificación.
   * @returns {{channel: string, kind: string, moment: string, reason: string}}
   */
  function selectDelivery(profile, eligibility, enabled) {
    // Una negativa se comunica siempre con una persona delante.
    if (eligibility.status === "no") {
      return {
        channel: "Asesor humano",
        kind: "advisor",
        moment: "Contacto inmediato",
        reason: "Decisión de protección requiere trato humano.",
      };
    }

    // Sin consentimiento de canal no se usa ningún canal digital.
    if (!enabled.cont) {
      return {
        channel: "Asesor telefónico",
        kind: "advisor",
        moment: "Horario laboral",
        reason: "Sin consentimiento digital.",
      };
    }

    let channel;
    if (profile.preferredChannel === "app" && (profile.digitalScore || 0) > APP_ENGAGEMENT_THRESHOLD) {
      channel = "Notificación push en la app";
    } else if (profile.preferredChannel === "whatsapp") {
      channel = "WhatsApp";
    } else if (profile.hasEmail) {
      channel = "Correo electrónico";
    } else {
      channel = "Asesor telefónico";
    }

    const kind =
      channel.indexOf("push") !== -1
        ? "push"
        : channel === "WhatsApp"
          ? "whatsapp"
          : channel.indexOf("Correo") !== -1
            ? "email"
            : "advisor";

    return {
      channel,
      kind,
      moment: "Próxima ventana óptima · " + ORIGEN.domain.advanced.policy.contactSlot(profile.id),
      reason: "Canal preferido y franja de apertura.",
    };
  }

  /**
   * Redacta el mensaje para el afiliado.
   *
   * Orden deliberado: primero la negativa, después la espera, después la causa
   * concreta si hay deuda que ordenar, y solo al final el mensaje genérico.
   * Cada rama nombra el motivo real.
   */
  function compose(profile, eligibility, best, stage, window) {
    const { money } = ORIGEN.core.format;

    if (eligibility.status === "no") {
      return (
        "Revisamos tu solicitud. Hoy el crédito sumaría riesgo por tu carga actual. " +
        "Preparamos un plan para ti a seis meses."
      );
    }

    if (eligibility.status === "espera") {
      return (
        "Tu solicitud es viable. Pero si esperas a " + window.when + ", " +
        window.reason.charAt(0).toLowerCase() + window.reason.slice(1) + " Te avisamos entonces."
      );
    }

    if (best.product === "Crédito de consumo" && profile.externalBalance > 0) {
      return (
        "Vimos que pagas " + profile.obligations + " créditos por fuera a tasas altas. " +
        "Si los unificas, liberas " + money(profile.externalPayment * 0.28) + " al mes."
      );
    }

    return (
      "Llevas " + profile.affiliationYears + " años con nosotros. Tu perfil nos permite " +
      "ofrecerte " + best.product.toLowerCase() + " ajustado a tu etapa de " +
      stage.stage.toLowerCase() + "."
    );
  }

  ORIGEN.domain.advanced.delivery = { selectDelivery, compose };
})(window.ORIGEN);
