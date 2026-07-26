# ORIGEN · Copiloto de Deliberación Financiera

**Reto:** Crédito Hiperpersonalizado · Hackathon Colsubsidio y 30X · Julio 2026

> El mejor crédito no es el que se puede aprobar, sino el que mejora una vida.

ORIGEN es un copiloto para los analistas de crédito de Colsubsidio. Recibe una
cédula —o un lote—, enriquece el perfil con variables autorizadas, evalúa las
siete líneas del portafolio, proyecta el bienestar del afiliado a doce meses y
recomienda **una** decisión: un producto, un producto con condiciones, o una
Ruta de Bienestar cuando prestar no conviene.

No responde «¿qué crédito podemos colocar?» sino «¿cuál es la mejor decisión
financiera para esta persona, hoy?».

---

## Cómo ejecutarlo

**Requisitos: ninguno.** Sin Node, sin npm, sin Python, sin base de datos, sin
APIs externas.

1. Clona o descarga el repositorio.
2. Doble clic en **`index.html`**.

Eso es todo. Funciona en Chrome, Edge, Firefox y Safari.

| Archivo | Qué es |
|---|---|
| **`index.html`** | La Estación de Decisión — la aplicación |
| `pitch.html` | Landing conceptual de la propuesta |
| `tests/index.html` | Las pruebas del motor: doble clic y se ejecutan |

### Pruebas

Doble clic en `tests/index.html`, o en consola:

```bash
node tests/run-node.js
```

51 pruebas sobre determinismo, política de capacidad, scorer, proyección,
enmascaramiento de PII y formato. Salen en verde o el motor está roto.

---

## Qué lo hace distinto

**Delibera, no clasifica.** Antes de recomendar, puntúa las siete líneas y
muestra el ranking completo — incluido lo que quedó segundo y por cuánto perdió.

**Caja de cristal, no caja negra.** El puntaje es una suma de aportes nombrados
y trazables. Un auditor puede sumar las barras a mano y obtener el número que
muestra la pantalla; hay una prueba automática que lo verifica en los 220
perfiles. Ningún modelo estocástico decide si se otorga crédito: ante la
Superintendencia Financiera eso no sería defendible.

**Sabe decir «hoy no».** Proyecta tres caminos —otorgar, esperar, acompañar— y
gana el que deja mejor al afiliado. La Ruta de Bienestar no es una excepción
añadida a mano: emerge de comparar escenarios. Cuando la política bloquea el
desembolso, acompañar gana por construcción.

**Cero Datacrédito.** La carga externa se infiere del comportamiento de pago y
del perfil de gasto, cumpliendo la restricción del reto.

**Timing y canal.** Un mapa de calor de 7 días × 18 horas deduce la ventana de
mayor conexión, y el canal se elige por regla declarada: una negativa siempre va
por voz humana, los mayores de 55 nunca reciben push.

**Privacidad por defecto.** Nombre, cédula y correo se muestran censurados hasta
que el asesor los necesita. El panel se usa en oficinas abiertas y se proyecta en
demostraciones.

---

## Estructura

```
index.html              Aplicación: solo markup, sin CSS ni JS embebidos
pitch.html              Landing del pitch
SPEC.md                 Especificación de requerimientos (entregable)
avance.md               Registro de avance del equipo

assets/
  brand/                Logos, favicon y paleta oficial
  css/                  5 capas: tokens → base → layout → components → views
  js/
    core/               Configuración, aleatoriedad sembrada, formato, catálogo
    domain/             El motor: momento de vida, scoring, capacidad,
                        proyección, narrativa, decisión
    ui/                 DOM, privacidad, gráficos, vistas, enrutador
    main.js             Arranque

tests/                  Ejecutor propio + 6 especificaciones
docs/
  ARCHITECTURE.md       Cómo está construido y por qué
  MEJORAS.md            Deuda técnica y decisiones pendientes ← empieza aquí
  manual-de-marca.html  Manual de identidad cromática de Colsubsidio
```

---

## Tecnología

HTML5, CSS3 y JavaScript ES6+ nativos. Cero dependencias de terceros —
incluidos los gráficos, que son SVG generado a mano.

La decisión no es minimalismo por gusto: una dependencia de CDN es un punto de
fallo justo en el momento de la demostración, y el criterio de aceptación exige
arrancar en menos de cinco minutos.

Ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para el detalle, y
[`docs/MEJORAS.md`](docs/MEJORAS.md) para lo que falta.

---

*Jesus Ruiz y Yeisson Abril · Hackathon Colsubsidio y 30X · Julio 2026*
