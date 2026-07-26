# Arquitectura de ORIGEN — el código

Cómo está construido el software y por qué. Para el negocio, ver
[`../README.md`](../README.md); para lo que falta,
[`MEJORAS.md`](MEJORAS.md).

> **No confundir con [`../ARCHITECTURE.md`](../ARCHITECTURE.md)**, en la raíz del
> repositorio. Ese documento es de producto: arquitectura AS-IS frente a la
> ideal de producción, capa de ciberseguridad y material de pitch. Este describe
> la organización del código que corre hoy. Los dos son útiles y no se solapan,
> pero comparten nombre — conviene renombrar uno de los dos
> (ver [`MEJORAS.md §8`](MEJORAS.md)).

---

## 1. Principio de diseño

**Zero-dependency, y las consecuencias se asumen enteras.**

El criterio de aceptación número uno del reto es que la solución arranque con
doble clic, sin instalar nada. Eso descarta npm, bundlers, frameworks y CDNs de
librerías — y también descarta módulos ES, porque el protocolo `file://` los
bloquea por política de origen cruzado.

La restricción no se esquiva: se acepta y se organiza el código para que la
modularidad no dependa de una herramienta de compilación.

El resto de decisiones se derivan de ahí.

---

## 2. Capas

```
┌─────────────────────────────────────────────────────────┐
│  index.html          markup semántico, sin lógica       │
├─────────────────────────────────────────────────────────┤
│  ui/                 presentación                       │
│    router  main  views/*  blocks  charts  toast         │
│    privacy  dom                                         │
├─────────────────────────────────────────────────────────┤
│  domain/             el motor de deliberación           │
│    dataset ← decision ← { scoring, capacity,            │
│                          projection, narrative }        │
│                        ← { population, lifestage,       │
│                            engagement }                 │
├─────────────────────────────────────────────────────────┤
│  core/               utilidades sin dominio             │
│    config  math  random  format  catalog  namespace     │
└─────────────────────────────────────────────────────────┘
```

**La regla es una sola: las flechas apuntan hacia abajo.** `core` no sabe nada
de dominio. `domain` no sabe nada del DOM — se puede ejecutar en Node, y de
hecho las pruebas lo hacen. `ui` consume dominio pero nunca calcula reglas de
crédito.

Si alguna vez hace falta un backend, `domain/` se mueve al servidor sin tocar
una línea: no tiene ninguna referencia a `document` ni a `window` más allá del
espacio de nombres.

---

## 3. El motor, paso a paso

`domain/decision.js` encadena la secuencia completa. **El orden es la política**,
no una casualidad de implementación:

| # | Etapa | Archivo | Qué decide |
|---|---|---|---|
| 1 | Capacidad | `capacity.js` | Cuánta cuota tolera su momento de vida |
| 2 | Deliberación | `scoring.js` | Qué producto encaja con sus señales |
| 3 | Dimensión | `capacity.js` | Cuánto se puede prestar sin romper política |
| 4 | Proyección | `projection.js` | Qué camino lo deja mejor a doce meses |
| 5 | Veredicto | `decision.js` | El camino ganador decide |
| 6 | Entrega | `engagement.js` | Canal y franja horaria |
| 7 | Narrativa | `narrative.js` | La razón en lenguaje natural |

Dos consecuencias importantes de este orden:

- **El monto se calcula después del tope de cuota, nunca antes.** No se parte de
  un monto deseado para después justificar la cuota.
- **El veredicto lo fija la proyección de bienestar, no la apetencia comercial.**
  Por eso «no prestar» puede ganar: es el resultado de comparar caminos.

### Explicabilidad como invariante

El puntaje de cada producto es literalmente la suma de sus aportes. No es una
aspiración: `tests/specs/scoring.spec.js` lo comprueba en los 7 productos × 220
perfiles = 1.540 verificaciones por ejecución.

### Determinismo

`core/random.js` implementa mulberry32 sembrado desde `core/config.js`. La misma
semilla produce la misma población y las mismas decisiones en cada carga.

**El determinismo depende del ORDEN de consumo, no solo de la semilla.** Añadir,
quitar o mover una llamada aleatoria dentro de
`population.createSyntheticAffiliate` desplaza toda la secuencia posterior y
cambia la población entera. Si necesitas una variable nueva, añádela **al final**
de la función. La advertencia está repetida en la cabecera de los dos archivos
implicados, y hay pruebas que fallan si se rompe.

---

## 4. Estilos

Cinco capas en cascada, cada una solo puede depender de las anteriores:

| Capa | Archivo | Contenido |
|---|---|---|
| 1 | `tokens.css` | Variables. **Única fuente de color del proyecto** |
| 2 | `base.css` | Reset, tipografía, foco, movimiento reducido |
| 3 | `layout.css` | Armazón persistente: barra lateral, superior, contenido |
| 4 | `components.css` | Piezas reutilizables: botones, tarjetas, tablas, KPI |
| 5 | `views.css` | Anatomía de pantallas concretas |

Ninguna hoja fuera de `tokens.css` declara un color literal, y **ningún archivo
JavaScript conoce un hexadecimal**: el catálogo de señales guarda referencias
`var(--sig-*)` y los gráficos aplican clases. Cambiar la paleta es editar un
archivo.

### Marca y accesibilidad

`tokens.css` declara los tres colores del manual de Colsubsidio como primitivas
documentales, y por encima define los tokens semánticos que la interfaz usa.
Los dos niveles existen porque los colores de marca están calibrados para fondo
blanco y esta interfaz es oscura. Contrastes medidos (WCAG 2.1, mínimo 4.5:1):

| Color | Sobre `--bg` | ¿AA? |
|---|---|---|
| Azul oficial `#0067b1` | 3.20:1 | ✕ |
| Azul aclarado `#5B87C7` | 5.14:1 | ✓ |
| Amarillo oficial `#ffd000` | 12.78:1 | ✓ |
| Ámbar actual `#C08A2E` | 6.19:1 | ✓ |

**El azul debe aclararse por accesibilidad. El amarillo no necesita
oscurecerse** — el ámbar es una decisión estética, no técnica. Poner
`data-brand="oficial"` en `<html>` cambia el acento al amarillo exacto del
manual sin tocar código. Ver [`MEJORAS.md §2.5`](MEJORAS.md).

---

## 5. Reemplazo de la fuente de datos (drop-in)

`domain/population.js` genera afiliados sintéticos. **Es la única pieza que hay
que sustituir para conectar los feeds reales de Colsubsidio.**

Cualquier fuente que produzca objetos con esta forma es intercambiable:

```js
{
  id, name, gender, category, income, age,
  contractType, isSelfEmployed, tenureMonths,
  children, schoolAgeChildren,
  networkUsage,               // 0–1, uso del ecosistema Colsubsidio
  hasRuesActivity,
  unbankedIncomeMonths,
  intent, intentIsRecent, lifeEvent,
  externalDebt: { count, balance, annualRate },
  internalObligations,
  currentLoad,                // fracción del ingreso ya comprometida
  hasSeasonalNeed, email,
  lifeStage,                  // o dejar que lo infiera domain/lifestage.js
  engagementMatrix            // 7×18, o construirla con domain/engagement.js
}
```

Nada más del motor cambia: `decision.js` no sabe de dónde vinieron los datos.
Los tres perfiles de demostración son literales escritos a mano y sobreviven a
cualquier cambio del generador — por eso se pueden citar en el pitch con la
certeza de que darán el mismo resultado.

---

## 6. Módulos: por qué IIFE y cómo migrar a ESM

Cada archivo es una función autoejecutada que publica su API en el objeto global
`ORIGEN`:

```js
(function (ORIGEN) {
  "use strict";
  function algo() { /* … */ }
  ORIGEN.domain.algo = algo;   // única salida
})(window.ORIGEN);
```

Un solo símbolo global, sin fugas de variables internas, con las dependencias
declaradas en la cabecera de cada archivo. **El orden de las etiquetas `<script>`
en `index.html` es el grafo de dependencias**, y está comentado ahí.

Es equivalente a módulos, con una diferencia: el orden lo garantiza una persona
en lugar del cargador. Si añades un archivo, colócalo después de todo lo que
consume.

### Migración a ES Modules

Cuando el proyecto deje de necesitar ejecutarse desde `file://`, la conversión es
mecánica y por archivo:

1. Sustituir el envoltorio IIFE por `import` al inicio y `export` al final.
2. En `index.html`, reemplazar las 27 etiquetas `<script>` por una sola:
   `<script type="module" src="assets/js/main.js"></script>`.
3. Servir por HTTP (`npx serve`, `python -m http.server`, o cualquier hosting
   estático).

No hace falta reescribir lógica: el corte entre archivos ya está hecho y las
dependencias ya son explícitas. Lo que se pierde es el doble clic — que hoy es
un criterio de aceptación, así que la migración es para después del hackathon.

---

## 7. Eventos y estado

**Ningún manejador se escribe como atributo HTML.** No hay `onclick=` ni
`onchange=` en el proyecto. Motivos: los atributos inline obligan a que las
funciones sean globales, impiden endurecer la política de seguridad de contenido
(una CSP sin `unsafe-inline`) y mezclan comportamiento con estructura.

Todo se registra por **delegación** en `main.js`, sobre contenedores que nunca se
destruyen (`#view`, `.rail`, `.topbar`). Las vistas se repintan completas con
`innerHTML`, así que enlazar a elementos concretos no funcionaría.

El estado mutable está concentrado en dos sitios y solo dos:

| Estado | Dónde | Por qué ahí |
|---|---|---|
| Decisiones + resoluciones del analista | `domain/dataset.js` | Es el dato de la sesión |
| Ruta y afiliado abierto | `ui/router.js` | Es navegación, no dominio |
| Filtro de la bandeja | `ui/views/inbox.js` | Es estado local de esa vista |

`ui/privacy.js` expone un `onChange` al que el enrutador se suscribe: alternar el
enmascaramiento repinta **la vista actual**, sea la que sea.

---

## 8. Seguridad

- **Escape de HTML.** Todo valor procedente de datos pasa por
  `core/format.escapeHtml` antes de concatenarse en una plantilla. Hoy la
  población es sintética; cuando se conecten los feeds reales, los nombres serán
  entrada externa y esto es lo único que separa la interfaz de una inyección.
- **Sin `eval`, sin `new Function`, sin `innerHTML` de origen externo.**
- **Enlaces externos** con `rel="noopener noreferrer"`.
- **PII enmascarada por defecto**, con punto único de paso (`ui/privacy.js`) para
  que ninguna vista pueda saltarse el enmascaramiento por descuido.

---

## 9. Accesibilidad

- Anillo de foco único con `:focus-visible` para navegación por teclado.
- Filas de la bandeja navegables con Tab y activables con Enter o Espacio.
- `aria-current="page"` marca la vista activa; los filtros usan `aria-pressed`.
- El aviso emergente es `role="status"` con `aria-live="polite"`: se anuncia sin
  robar el foco.
- Los gráficos SVG llevan `role="img"` y una `aria-label` que **incluye la
  conclusión**, no solo el título: un lector de pantalla anuncia qué escenario
  gana y por cuántos puntos.
- `prefers-reduced-motion` desactiva todas las animaciones. Ninguna comunica
  información por sí sola, así que no hay pérdida funcional.

Limitación conocida: por debajo de 900 px la barra lateral se oculta. Es un panel
de escritorio para analistas. Ver [`MEJORAS.md §4.2`](MEJORAS.md).

---

## 10. Convenciones de código

- **Identificadores en inglés, contenido en español.** El código usa
  `affiliate.tenureMonths`; los textos, comentarios y documentación van en
  español. Los términos sin equivalente limpio —`libranza`, `SMMLV`, `RUES`— se
  quedan como están: son nombres propios del dominio.
- **Nada de abreviaturas.** `unbankedIncomeMonths`, no `ingNoBanc`.
- **CSS en convención BEM:** `bloque`, `bloque__elemento`, `bloque--modificador`.
- **Ningún número mágico en la lógica.** Todo parámetro de negocio vive en
  `core/config.js` o en `core/catalog.js`. Si un número aparece suelto en el
  motor, es un defecto.
- **Los comentarios explican por qué, no qué.** El código ya dice qué hace.
