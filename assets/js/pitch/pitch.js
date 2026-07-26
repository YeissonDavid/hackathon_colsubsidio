/**
 * Kepler · Comportamiento de la landing del pitch
 * ---------------------------------------------------------------------------
 * Solo efectos de presentación: revelado de secciones al entrar en pantalla y
 * un fondo de partículas. Ninguna lógica de negocio vive aquí — la landing es
 * material de comunicación, la aplicación está en index.html.
 *
 * Todo respeta `prefers-reduced-motion`: si el usuario pidió menos movimiento,
 * las secciones se muestran de golpe y las partículas no se dibujan.
 *
 * Dependencias: ninguna.
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Navegación interna ----------------------------------------------
     Los botones declaran su destino con data-scroll-to y un único escucha
     delegado los atiende. Antes eran atributos onclick inline, que obligan a
     permitir `unsafe-inline` en la política de seguridad de contenido. */

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-scroll-to]");
    if (!trigger) return;

    const target = document.getElementById(trigger.dataset.scrollTo);
    if (!target) return;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  });

  /* --- Revelado progresivo de secciones -------------------------------- */

  const revealTargets = document.querySelectorAll(".fu, .fs");

  if (prefersReducedMotion) {
    revealTargets.forEach(function (element) {
      element.classList.add("visible");
    });
  } else {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );

    revealTargets.forEach(function (element) {
      observer.observe(element);
    });

    // Escalona la entrada de las tarjetas de cada rejilla de tres columnas.
    document.querySelectorAll(".pc, .dc, .ec").forEach(function (element, index) {
      element.style.transitionDelay = (index % 3) * 0.1 + "s";
    });
  }

  /* --- Fondo de partículas --------------------------------------------- */

  /** Número de partículas simultáneas. */
  const PARTICLE_COUNT = 80;

  /** Paleta: los dos colores de marca más blanco. */
  const PARTICLE_COLORS = ["#ffd000", "#0067b1", "#ffffff"];

  function startParticles() {
    const canvas = document.getElementById("pc");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    /** Una partícula nueva, en posición y velocidad aleatorias. */
    function spawn() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.4 + 0.1), // siempre hacia arriba
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        alpha: Math.random() * 0.6 + 0.15,
        life: 0,
        maxLife: Math.random() * 300 + 200,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(function (particle, index) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life++;

        // Aparición y desaparición suaves en los extremos de la vida.
        const progress = particle.life / particle.maxLife;
        const alpha = particle.alpha * (1 - Math.pow(progress * 2 - 1, 4));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        ctx.restore();

        // Al agotarse o salir por arriba, reaparece desde abajo.
        if (particle.life >= particle.maxLife || particle.y < -10) {
          particles[index] = spawn();
          particles[index].y = canvas.height + 10;
        }
      });

      requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawn());
    draw();
  }

  if (!prefersReducedMotion) startParticles();
})();
