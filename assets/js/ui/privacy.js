/**
 * ORIGEN · Enmascaramiento de datos personales
 * ---------------------------------------------------------------------------
 * Privacy by design, Ley 1581 de 2012 (Habeas Data).
 *
 * Un panel de originación se usa en oficinas abiertas, con pantallas
 * compartidas y proyectores. El modo privacidad está ACTIVO por defecto: los
 * datos identificables se censuran hasta que el asesor los necesita de verdad.
 *
 * Punto único de paso. La versión anterior enmascaraba solo en el listado y
 * dejaba el nombre, la cédula y el correo en claro en la ficha del afiliado —
 * que es justamente la pantalla que se proyecta en una demostración. Aquí toda
 * PII pasa por `maskName`, `maskId` o `maskEmail`, y ninguna vista accede al
 * dato en claro por su cuenta.
 *
 * Dependencias: core/namespace.js
 */
(function (ORIGEN) {
  "use strict";

  let enabled = true;

  /** @type {Array<() => void>} Suscriptores a los cambios de modo. */
  const listeners = [];

  /** ¿Está activo el enmascaramiento? */
  function isEnabled() {
    return enabled;
  }

  /** Activa o desactiva el enmascaramiento y notifica a los suscriptores. */
  function setEnabled(value) {
    enabled = Boolean(value);
    listeners.forEach(function (listener) {
      listener();
    });
  }

  /**
   * Registra un suscriptor que debe repintar cuando cambie el modo.
   *
   * Con esto, alternar el interruptor repinta la vista ACTUAL. Antes llamaba
   * directamente al renderizador de la bandeja, así que activar o desactivar
   * el modo desde la ficha de un afiliado te expulsaba al listado.
   */
  function onChange(listener) {
    listeners.push(listener);
  }

  /**
   * Nombre censurado: se conserva la inicial de cada palabra.
   * «Laura Medina» → «L**** M*****»
   */
  function maskName(name) {
    if (!enabled) return name;
    return String(name)
      .split(" ")
      .map(function (word) {
        return word.charAt(0) + "*".repeat(Math.max(0, word.length - 1));
      })
      .join(" ");
  }

  /**
   * Cédula censurada: se conservan los separadores y el prefijo del documento.
   * «CC 52.114.883» → «CC **.***.***»
   */
  function maskId(id) {
    if (!enabled) return id;
    return String(id).replace(/\d/g, "*");
  }

  /**
   * Correo censurado: se conserva la inicial de la parte local y el dominio,
   * porque el dominio no identifica a la persona y el analista necesita saber
   * si el canal es corporativo o personal.
   * «maria.gomez@gmail.com» → «m***@gmail.com»
   */
  function maskEmail(email) {
    if (!enabled) return email;
    const text = String(email);
    const at = text.indexOf("@");
    if (at <= 0) return "***";
    return text.charAt(0) + "***" + text.slice(at);
  }

  ORIGEN.ui.privacy = { isEnabled, setEnabled, onChange, maskName, maskId, maskEmail };
})(window.ORIGEN);
