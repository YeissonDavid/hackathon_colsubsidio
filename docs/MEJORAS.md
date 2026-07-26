# Informe de refactorización y mejoras pendientes

Fecha: 26 de julio de 2026 · Alcance: reestructuración completa de la base de
código, sin cambiar el comportamiento del motor.

Este documento es el mapa de lo que se hizo, lo que se corrigió y **lo que
todavía tienes que decidir tú**. Las secciones §2 y §6 son las importantes antes
del pitch.

---

## 1. Qué se cambió

### 1.1 El punto de partida

`index.html` era un archivo de **68.595 bytes en 22 líneas**. Tres de esas líneas
concentraban todo el proyecto:

| Línea | Caracteres | Contenido |
|---|---|---|
| 2 | 20.770 | Todo el CSS + el inicio del `<body>` |
| 7 | 15.501 | El motor completo: población, scoring, proyección, decisión |
| 20 | 30.742 | Toda la interfaz + el cierre del documento |

Las consecuencias no eran estéticas:

- **`git diff` era inútil.** Cambiar una palabra marcaba 20.000 caracteres como
  modificados. No se podía revisar nada.
- **Dos personas no podían trabajar a la vez.** Cualquier cambio en el mismo
  archivo era un conflicto irresoluble.
- **No se podía localizar un error.** Un fallo «en la línea 7, columna 14.203» no
  dice nada.
- **Nada era comprobable.** El motor y el DOM estaban en el mismo archivo, así
  que no se podía ejecutar la lógica sin un navegador.

La causa raíz eran `update_2.py` y `update_html.py`: dos scripts que parcheaban
el HTML con búsqueda y reemplazo de texto. De los 8 commits del repositorio,
**dos son arreglos de errores de sintaxis que esos scripts introdujeron**
(`Fix syntax error const =id`, `Fix syntax error caused by python script wrapping
in index.html`). Los scripts se eliminaron: parchear código generado con
expresiones regulares no es un flujo de trabajo, es una fuente de defectos.

### 1.2 El resultado

```
index.html         179 líneas   solo markup semántico
assets/css/      2.066 líneas   5 capas
assets/js/       3.708 líneas   27 módulos (core, domain, ui)
tests/             818 líneas   ejecutor propio + 6 especificaciones
```

Ningún archivo pasa de 330 líneas. Cada uno declara sus dependencias en la
cabecera y explica **por qué** hace lo que hace.

### 1.3 Verificación de que no se rompió nada

Esto era el riesgo real del refactor. Se comprobó extrayendo el motor original
de `git show HEAD:index.html`, ejecutándolo en Node y comparando su salida con la
del motor nuevo, perfil por perfil:

**220 de 220 decisiones idénticas** en producto, veredicto, monto, cuota,
confianza, ventana de contacto, canal, puntaje del ganador, los tres puntos
finales de la proyección y la carga final.

El refactor es demostrablemente neutro. Puedes afirmarlo ante el jurado.

---

## 2. Decisiones de contenido que tienes que tomar tú

Esto **no** lo he cambiado: son decisiones de producto, no de programación. Pero
son contradicciones visibles y un jurado atento puede encontrarlas.

### 2.1 El catálogo de productos tiene dos versiones en conflicto

| Fuente | Catálogo |
|---|---|
| `ORIGEN documento maestro.docx` y el código | Cupo rotativo · Compra de cartera · Hipotecario · Educativo · **Crédito Mujer** · Rotativo seguros · Complementario |
| `avance.md` (23-jul-2026) | Hipotecario · **Consumo general** (absorbe Crédito Mujer) · **Libre Inversión** · Educativo · Rotativo cupo · Rotativo seguros · Compra de cartera |

Los dos hablan de «7 líneas», pero no son las mismas siete. `avance.md` es
posterior y dice explícitamente que Crédito Mujer se fundió en Consumo general —
el código sigue el documento maestro y mantiene Crédito Mujer como línea propia.

**Hay que elegir una**, y la elegida debe aparecer igual en el código, en el
documento maestro, en `SPEC.md` y en el pitch. Si el jurado ve dos catálogos
distintos, la propuesta pierde credibilidad justo en el punto que más cuidaste.

Dónde tocar si cambias: `assets/js/core/catalog.js` (`PRODUCTS` y
`PORTFOLIO_RULES`) y las reglas de `assets/js/domain/scoring.js`.

### 2.2 Un producto nunca puede ganar

`Crédito complementario` recibe siempre exactamente 12 puntos («Necesidad
puntual») y nada más. En los 220 perfiles **no gana ni una sola vez**: cualquier
otro producto con señal lo supera.

Es el mismo hueco que `avance.md` ya identificó para otras líneas. No es un
error: es una línea del catálogo sin señal mapeada. Pero si te preguntan «¿y este
producto cuándo se recomienda?», la respuesta honesta hoy es «nunca».

Dos salidas: darle una señal propia, o declararlo explícitamente como línea de
reserva en la vista de portafolio.

### 2.3 Los perfiles demo no coinciden con el documento maestro

| Documento maestro | Código |
|---|---|
| María Rodríguez, 38 | María Gómez Rojas, 38 |
| Ana Torres, 29 | **Andrés** Torres Peña, **27** |
| Carlos Gómez, 45 | Carlos Ramírez Mora, **26** |

El caso de Ana cambia de género y el de Carlos pierde 19 años. Si muestras el
documento y después la demo, los nombres y las edades no cuadran.

Lo bueno: **el ranking de María sí coincide exactamente** con el del documento
maestro —cartera 65, Crédito Mujer 54, cupo 52, hipotecario 37, gana por 11
puntos—. Eso está verificado con una prueba automática
(`tests/specs/scoring.spec.js`), así que puedes proyectar el documento y la
pantalla lado a lado con total confianza en las cifras. Solo hay que unificar
nombres y edades.

### 2.4 El producto tiene dos nombres

`index.html` y toda la documentación dicen **ORIGEN**. `pitch.html` dice
**Kepler**, con su propio logotipo y su propia narrativa («del bug al billete»,
detección de bugs de UX, capa agéntica) que no existe en la aplicación.

Son dos propuestas distintas presentadas como una. Antes del pitch hay que
decidir cuál es el producto y alinear la landing con la demo, o el jurado no
sabrá qué está evaluando.

### 2.5 La afirmación de marca del README era falsa (corregida)

El README anterior decía que los colores oficiales `#ffd000`, `#0067b1` y
`#575756` estaban «aplicados estrictamente en el CSS de `index.html`». No lo
estaban: la interfaz usaba `#C08A2E` (ámbar) y `#5B87C7` (azul aclarado), que
están a 11° de matiz de los oficiales. El único uso del amarillo real era el mapa
de calor.

Un jurado de Colsubsidio con el manual de marca delante lo habría visto.

Qué se hizo: `tokens.css` ahora declara los tres colores oficiales como
primitivas documentadas, define los tokens semánticos por encima y **explica la
derivación con contrastes medidos**. La conclusión honesta quedó escrita en el
propio archivo:

- El azul oficial da **3.20:1** sobre el fondo oscuro → incumple WCAG AA. Debe
  aclararse. La derivación está justificada.
- El amarillo oficial da **12.78:1** → cumple de sobra. **No hacía falta
  oscurecerlo**: el ámbar es una decisión estética.

Y se añadió una salida de una línea: poner `data-brand="oficial"` en la etiqueta
`<html>` cambia el acento al amarillo exacto del manual. Puedes probar las dos
lecturas y quedarte con la que prefieras — pero ahora el README dice la verdad
sobre cualquiera de las dos.

---

## 3. Defectos corregidos

Todos son cambios de comportamiento, y todos son arreglos de cosas que estaban
mal. Los enumero para que sepas exactamente qué se movió.

### 3.1 La ficha del afiliado filtraba toda la PII — el más grave

`DOCUMENTATION.md` afirmaba «cero exposición accidental de datos sensibles en
pantallas compartidas». No era cierto: el enmascaramiento solo se aplicaba en el
listado. En la ficha del afiliado —**la pantalla que se proyecta en la
demostración**— se mostraban en claro:

- el nombre completo,
- la cédula completa, dos veces (cabecera y referencia de la resolución),
- el correo electrónico completo.

Ahora todo pasa por `ui/privacy.js`, que es punto único de paso, e incluye
enmascaramiento de correo (`m***@gmail.com`, conservando el dominio porque no
identifica a la persona y el analista necesita saber si el canal es corporativo).
Hay 8 pruebas que lo cubren, una de ellas verificando que **ningún dígito de
cédula** se escapa en los 220 perfiles.

### 3.2 Alternar el modo privacidad te expulsaba de la ficha

El interruptor llamaba directamente a `renderBandeja()`. Si estabas viendo un
afiliado y activabas o desactivabas «Ocultar PII», la aplicación te devolvía al
listado y perdías el caso que estabas mostrando. En medio de una demo, eso se ve.

Ahora `ui/privacy.js` notifica a suscriptores y el enrutador repinta **la vista
actual**, conservando el afiliado abierto.

### 3.3 El pie de página solo aparecía en una pantalla

El bloque con los créditos del equipo estaba dentro de la plantilla de
`renderBandeja()`, así que desaparecía en las otras tres vistas. Ahora vive en el
armazón de `index.html` y se ve siempre.

### 3.4 Las iniciales del avatar podían romper la aplicación

```js
${esc(a.nombre.split(" ")[0][0])}${esc(a.nombre.split(" ")[1][0])}
```

Con un nombre de una sola palabra, `split(" ")[1]` es `undefined` y acceder a
`[0]` lanza `TypeError`, que aborta el renderizado de toda la ficha. La población
sintética siempre genera tres palabras, así que nunca se disparó — pero los datos
reales de Colsubsidio sí traen nombres de una palabra. `core/format.initials`
ahora tolera una palabra, espacios de más y cadena vacía. Con pruebas.

### 3.5 Los colores del gráfico podían no dibujarse

El gráfico de proyección pasaba `stroke="var(--brass)"` como **atributo de
presentación SVG**. `var()` dentro de un atributo SVG no está soportado de forma
fiable en todos los navegadores; donde falla, las tres series se dibujan en negro
sobre fondo oscuro y el gráfico —que es tu mejor pieza de explicabilidad— queda
invisible.

Ahora el SVG solo lleva clases (`serie scenario--now`) y el color se aplica desde
`views.css`. Verificado en navegador: las tres series se dibujan.

### 3.6 Código muerto en la proyección

`project()` calculaba la serie `wait` completa dentro del bucle principal y
después la sobrescribía entera con un segundo bucle. Unas cuatro líneas de
aritmética cuyo resultado nunca se leía. Eliminadas; la serie que queda produce
exactamente los mismos valores.

### 3.7 Escape de HTML inconsistente

`esc()` existía pero se aplicaba a unos valores y no a otros: la cédula, el
correo y el tipo de contrato se insertaban en crudo. Hoy no es explotable porque
los datos son sintéticos, pero cuando se conecten los feeds reales los nombres
serán entrada externa. Ahora **todo** valor procedente de datos pasa por
`core/format.escapeHtml`, y hay pruebas de que neutraliza etiquetas y atributos.

### 3.8 Otros

- **Manejadores inline eliminados.** No queda ni un `onclick=` ni un `onchange=`
  en el proyecto. Todo por delegación de eventos, lo que además permite endurecer
  la CSP más adelante sin `unsafe-inline`.
- **La simulación del lote no se detenía al cambiar de vista**: el `setInterval`
  seguía corriendo contra elementos que ya no existían. Ahora hay `teardown()`.
- **Dos clics seguidos en «Ejecutar lote»** dejaban dos intervalos compitiendo por
  la misma barra. Ahora se cancela el anterior.
- **Los botones del CTA de `pitch.html` no hacían nada.** Ahora enlazan a la demo
  y a la arquitectura.
- **El logo del pie de `pitch.html`** apuntaba a la carpeta antigua de recursos.

---

## 4. Deuda técnica y riesgos pendientes

### 4.1 El SMMLV está fijado a mano

`core/config.js` declara `SMMLV: 1500000`. De ese número dependen los umbrales de
las categorías A, B y C, y por tanto el ingreso de toda la población sintética y
el tope de libranza.

**Hay que confirmarlo contra el decreto vigente.** Está marcado como
`PENDIENTE DE CALIBRAR` en el código. Si el valor es incorrecto, la distribución
de categorías se desplaza y los montos dejan de ser verosímiles — es el tipo de
detalle que un jurado de una caja de compensación detecta al instante.

Lo mismo aplica a los topes de endeudamiento por momento de vida (22 %–32 %):
están marcados como supuestos y deben calibrarse con la matriz de riesgo real.
Ya lo dice `SPEC.md §7`; ahora también lo dice el código.

### 4.2 No funciona bien en móvil

Por debajo de 900 px la barra lateral se oculta y la navegación queda solo
accesible desde el buscador. Las tablas de 7 columnas se comprimen.

Es defendible —es un panel de escritorio para analistas— pero conviene tenerlo
dicho antes de que alguien abra la demo en un teléfono. Y hay un matiz de
negocio: la evaluación de jurado que tenías guardada señalaba que el reto penaliza
las soluciones «enfocadas únicamente en un dashboard sin pensar en la experiencia
del afiliado». Un mockup del WhatsApp que recibe María cerraría ese hueco mejor
que hacer responsive el panel del analista.

### 4.3 Las tipografías vienen de un CDN

`index.html` carga IBM Plex desde Google Fonts. Si en la sala del pitch no hay
wifi, la interfaz cae a la tipografía del sistema — legible, porque toda la pila
declara alternativas, pero no es lo que ensayaste.

Solución, 10 minutos: descargar los `.woff2` a `assets/fonts/` y declararlos con
`@font-face`. Elimina la última dependencia externa del proyecto y hace la
afirmación «cero dependencias» literalmente cierta.

### 4.4 El índice de bienestar es un constructo sin validar

La escala 0–100 de la proyección está calibrada para **ordenar escenarios entre
sí**, no para leerse en absoluto. No es una probabilidad de mora ni un score
crediticio.

Está documentado en la cabecera de `projection.js`, pero conviene decirlo en voz
alta en el pitch antes de que lo pregunten: presentarlo como métrica absoluta
sería sobrevender.

### 4.5 Las 27 etiquetas `<script>` son una lista que hay que mantener a mano

Es el precio de no tener bundler. El orden está comentado y agrupado por capas,
pero si añades un archivo y lo pones en el sitio equivocado, falla en tiempo de
ejecución con un `undefined`.

Mitigación cuando deje de hacer falta el doble clic: migrar a ES Modules. La
conversión es mecánica y está descrita en
[`ARCHITECTURE.md §6`](ARCHITECTURE.md).

---

## 5. Qué no está probado

Las 51 pruebas cubren el motor: determinismo, política de capacidad, scorer,
proyección, ventana de contacto, privacidad y formato.

**No cubren el renderizado.** No hay pruebas de que un clic abra la ficha
correcta, de que el filtro filtre, o de que el gráfico dibuje. Eso exige un
entorno de pruebas de DOM (jsdom, Playwright) y por tanto dependencias e
instalación — precisamente lo que el criterio de aceptación descarta.

Compensación actual: la capa `ui/` es delgada y sin lógica de negocio, y se
verificó a mano en navegador (las cuatro vistas, la ficha, el filtro, el
buscador, el interruptor de PII y las acciones de resolución, sin errores en
consola).

Si después del hackathon quieres cerrar el hueco, el orden con mejor relación
valor/esfuerzo es: Playwright con tres pruebas de humo —cargar la bandeja, abrir
la ficha de María, comprobar que Carlos muestra Ruta de Bienestar—.

---

## 6. Orden sugerido de trabajo

Priorizado por impacto en la evaluación dividido por esfuerzo:

| # | Qué | Por qué | Esfuerzo |
|---|---|---|---|
| 1 | Unificar el nombre: ORIGEN o Kepler (§2.4) | Un jurado no debe dudar de qué evalúa | 30 min |
| 2 | Unificar el catálogo de productos (§2.1) | Contradicción visible entre tus propios documentos | 1 h |
| 3 | Alinear nombres y edades de los perfiles demo (§2.3) | El documento y la demo deben cuadrar en pantalla | 20 min |
| 4 | Confirmar el SMMLV (§4.1) | Un dato de negocio incorrecto se detecta al instante | 10 min |
| 5 | Mockup del WhatsApp de María | Cierra el punto flojo de la rúbrica: la experiencia del afiliado | 2 h |
| 6 | Tipografías en local (§4.3) | Hace literal la afirmación de cero dependencias | 10 min |
| 7 | Decidir qué hacer con Crédito complementario (§2.2) | Evita una pregunta incómoda | 30 min |

Los puntos 1 a 4 son de coherencia y cuestan poco más de dos horas entre todos.
El punto 5 es el único que añade material nuevo, y es el que más sube la nota en
la rúbrica de experiencia de usuario.

---

## 7. Sobre la carpeta `Margie/` que pediste borrar

Se eliminó del árbol de trabajo con `git rm`, junto con `update_2.py` y
`update_html.py`.

**Dos cosas que debes saber:**

1. **Contenía el documento maestro.** `ORIGEN documento maestro.docx` no era un
   borrador: son ~10.000 caracteres con el desafío, la propuesta, la tabla de
   variables exógenas con su base jurídica, la arquitectura de nueve motores, el
   caso de María y la tabla de cumplimiento del reto. Es el mejor material que
   tienes para el pitch. **Guardé una copia completa** (el `.docx` original más
   una extracción en texto) en:

   ```
   C:\Users\ANDREE~3\AppData\Local\Temp\claude\D--PROYECTOS-HACKATONES-30X-hackaton-colsubsidio\7ead9837-cf3c-403f-b71e-c74ef67d7e9a\scratchpad\margie_backup\
   ```

   Esa carpeta es temporal. Si el documento te importa, muévelo ya a un sitio
   permanente. Tienes una carpeta `private/` que está en el `.gitignore` y que
   sirve exactamente para esto.

2. **Sigue en el historial de git.** `git rm` borra del árbol, no del pasado:
   `git show 58ca85d:"Margie/evaluacion_origen.md"` lo recupera. Si el contenido
   —incluida la evaluación de jurado con los puntos débiles del proyecto— no debe
   quedar en un repositorio que vas a compartir, borrarlo del árbol no basta;
   habría que reescribir el historial (`git filter-repo`) y forzar el push, lo
   cual es destructivo y afecta a cualquiera que tenga un clon. Dime si quieres
   que lo hagamos.

---

## 8. Ficheros que ya estaban y no he tocado

- **`.gitignore`**, **`private/README.md`** y **`ARCHITECTURE.md`** (en la raíz)
  aparecieron en el proyecto mientras trabajaba. No son míos, así que los dejé
  exactamente como estaban.

  - El `.gitignore` está bien planteado y cubre lo que hace falta.
  - `private/README.md` enlaza a tres documentos (`00-arquitectura-ideal.md`,
    `01-contratos-y-esquemas.md`, `02-gap-origen-vs-ideal.md`) que todavía no
    existen en esa carpeta.
  - **Hay una colisión de nombres que conviene resolver:** el `ARCHITECTURE.md`
    de la raíz es un documento de producto (AS-IS frente a ideal, capa de
    ciberseguridad, material de pitch) y el `docs/ARCHITECTURE.md` que escribí es
    de código. Están en carpetas distintas, así que no hay conflicto técnico,
    pero dos archivos con el mismo nombre y propósitos distintos se confunden.
    Sugerencia: renombrar el de la raíz a `ARQUITECTURA-PRODUCTO.md` o mover el
    mío a `docs/CODIGO.md`. Dime cuál prefieres y lo hago, incluidas las
    referencias cruzadas.
- **`avance.md`** — es el registro del equipo, no documentación técnica. Lo dejé
  intacto salvo por lo señalado en §2.1.
- **`SPEC.md`** — entregable del reto. Solo se actualizó la referencia a la
  estructura de archivos, que había cambiado.
- **`DOCUMENTATION.md`** — su contenido se reescribió y amplió en
  [`ARCHITECTURE.md`](ARCHITECTURE.md); el archivo antiguo se eliminó para no
  mantener dos documentos técnicos divergentes.
