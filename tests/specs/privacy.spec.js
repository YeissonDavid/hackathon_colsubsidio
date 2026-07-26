/**
 * Privacy by design · Ley 1581 de 2012
 * ---------------------------------------------------------------------------
 * El enmascaramiento de PII se afirma en la documentación como característica
 * del producto, así que se prueba como tal. En la versión anterior el
 * enmascaramiento solo cubría el listado y dejaba nombre, cédula y correo en
 * claro en la ficha — la pantalla que se proyecta en la demostración.
 */
(function (ORIGEN, T) {
  "use strict";

  const { describe, it, expect } = T;
  const privacy = ORIGEN.ui.privacy;

  describe("Enmascaramiento de PII", function () {
    it("está activo por defecto", function () {
      expect(privacy.isEnabled()).toBeTruthy(
        "un panel de originación se usa en oficinas abiertas: por defecto se oculta"
      );
    });

    it("censura el nombre conservando las iniciales", function () {
      privacy.setEnabled(true);
      expect(privacy.maskName("Laura Medina")).toBe("L**** M*****");
      expect(privacy.maskName("María Gómez Rojas")).toBe("M**** G**** R****");
    });

    it("censura todos los dígitos de la cédula y conserva el formato", function () {
      privacy.setEnabled(true);
      expect(privacy.maskId("CC 52.114.883")).toBe("CC **.***.***");
      expect(privacy.maskId("CC 1.020.774.551")).toBe("CC *.***.***.***");
    });

    it("censura el correo conservando el dominio", function () {
      // El dominio no identifica a la persona y el analista necesita saber si
      // el canal es corporativo o personal.
      privacy.setEnabled(true);
      expect(privacy.maskEmail("maria.gomez@gmail.com")).toBe("m***@gmail.com");
    });

    it("no deja pasar ningún dígito de la cédula estando activo", function () {
      privacy.setEnabled(true);

      ORIGEN.domain.dataset.build().forEach(function (d) {
        const masked = privacy.maskId(d.affiliate.id);
        expect(/\d/.test(masked)).toBeFalsy(d.affiliate.id + " → " + masked);
      });
    });

    it("devuelve el dato en claro cuando el analista lo desactiva", function () {
      privacy.setEnabled(false);
      expect(privacy.maskName("Laura Medina")).toBe("Laura Medina");
      expect(privacy.maskId("CC 52.114.883")).toBe("CC 52.114.883");
      expect(privacy.maskEmail("maria.gomez@gmail.com")).toBe("maria.gomez@gmail.com");

      privacy.setEnabled(true); // restaura el estado seguro
    });

    it("notifica a los suscriptores al cambiar de modo", function () {
      // De esto depende que alternar el interruptor repinte la vista actual en
      // lugar de expulsar al analista a la bandeja.
      let notifications = 0;
      privacy.onChange(function () {
        notifications++;
      });

      privacy.setEnabled(false);
      privacy.setEnabled(true);

      expect(notifications).toBe(2);
    });

    it("la búsqueda encuentra al afiliado aunque la pantalla esté censurada", function () {
      privacy.setEnabled(true);
      const hit = ORIGEN.domain.dataset.find("52.114.883");

      expect(Boolean(hit)).toBeTruthy("se busca sobre el dato real, no sobre el enmascarado");
      expect(hit.affiliate.name).toBe("María Gómez Rojas");
    });
  });
})(window.ORIGEN, window.TestRunner);
