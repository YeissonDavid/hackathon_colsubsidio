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
index.html         200 líneas   solo markup semántico, 9 vistas
assets/css/      2.560 líneas   6 capas
assets/js/       6.000 líneas   41 módulos (core, domain, advanced, ui)
tests/           1.100 líneas   ejecutor propio + 7 especificaciones (75 pruebas)
```

Ningún archivo pasa de 340 líneas. Cada uno declara sus dependencias en la
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

### 2.1 Tres catálogos de productos conviven (parcialmente resuelto)

El equipo ya cerró el catálogo base: **5 líneas** —Cupo de crédito, Crédito de
consumo, Crédito de vivienda, Crédito de mujeres, Crédito educativo—. Eso
resolvió las dos contradicciones anteriores: «Compra de cartera» pasó a ser
«Crédito de consumo», el hipotecario a «vivienda», y desaparecieron el rotativo
de seguros y el complementario.

Queda una inconsistencia menor, pero visible: **el motor avanzado delibera sobre
un catálogo distinto**, con nombres largos y dos líneas que el base no tiene:

| Motor base (5) | Motor avanzado (7 alternativas) |
|---|---|
| Cupo de crédito | Cupo de crédito **rotativo** |
| Crédito de consumo | Crédito de consumo |
| Crédito de **vivienda** | Crédito **hipotecario** |
| Crédito de mujeres | Crédito de mujeres |
| Crédito educativo | Crédito educativo |
| — | Rotativo para seguros e impuestos |
| — | Ruta de fortalecimiento |

Si el jurado pasa de la Bandeja al Simulador, ve «Crédito de vivienda» en una
pantalla e «Crédito hipotecario» en la otra para el mismo concepto. Unificar los
rótulos cuesta poco y elimina la duda.

Dónde tocar: `assets/js/core/catalog.js` (motor base) y
`assets/js/domain/advanced/{deliberation,lifestage}.js` (motor avanzado).

### 2.2 El producto que nunca ganaba ya no existe (resuelto)

`Crédito complementario` recibía siempre 12 puntos fijos y no ganaba en ninguno
de los 220 perfiles. Salió del catálogo, así que el hueco está cerrado.

Efecto colateral que conviene conocer: al retirar el rotativo de seguros, el
motor base también dejó de bonificar la estacionalidad en el escenario
«esperar». El campo `hasSeasonalNeed` se sigue generando y solo lo consume el
motor avanzado.

### 2.3 Los perfiles demo no coinciden con el documento maestro

| Documento maestro | Código |
|---|---|
| María Rodríguez, 38 | María Gómez Rojas, 38 |
| Ana Torres, 29 | **Andrés** Torres Peña, **27** |
| Carlos Gómez, 45 | Carlos Ramírez Mora, **26** |

El caso de Ana cambia de género y el de Carlos pierde 19 años. Si muestras el
documento y después la demo, los nombres y las edades no cuadran.

Lo bueno: **el ranking de María sí coincide exactamente** con el del documento
maestro —consumo 65, mujeres 54, cupo 52, vivienda 37, gana por 11
puntos—. Eso está verificado con una prueba automática
(`tests/specs/scoring.spec.js`), así que puedes proyectar el documento y la
pantalla lado a lado con total confianza en las cifras. Solo hay que unificar
nombres y edades.

### 2.4 El producto tiene dos nombres (resuelto)

`pitch.html` se presentaba como **Kepler** mientras la aplicación y toda la
documentación decían **ORIGEN**. El equipo confirmó que el producto es ORIGEN, y
la landing quedó alineada: título, meta descripción, logotipo, encabezados y las
16 menciones del cuerpo.

Queda una diferencia de fondo que no es de nombre sino de contenido: la landing
sigue vendiendo una narrativa —«del bug al billete», detección automática de
bugs de UX, capa agéntica con LLM— que **la aplicación no implementa**. Si el
jurado ve la landing y después la demo, va a buscar esas piezas y no las va a
encontrar.

Dos salidas honestas: quitar de la landing lo que no existe, o marcarlo
explícitamente como hoja de ruta y no como capacidad actual.

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

**Los dos motores usan valores distintos**, y esto sí es un defecto:

| Motor | Archivo | Valor |
|---|---|---|
| Base | `core/config.js` | `SMMLV: 1500000` |
| Avanzado | `domain/advanced/sources.js` | `SMMLV = 1423500` |

De ese número dependen los umbrales de las categorías A, B y C, el ingreso de
toda la población sintética, el tope de libranza y los grupos de equidad del
Laboratorio. Con dos valores, la misma persona cae en categorías distintas según
la pantalla.

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

### 4.5 Las 41 etiquetas `<script>` son una lista que hay que mantener a mano

Es el precio de no tener bundler. El orden está comentado y agrupado por capas,
pero si añades un archivo y lo pones en el sitio equivocado, falla en tiempo de
ejecución con un `undefined`.

Mitigación cuando deje de hacer falta el doble clic: migrar a ES Modules. La
conversión es mecánica y está descrita en
[`ARCHITECTURE.md §6`](ARCHITECTURE.md).

### 4.6 El Laboratorio bloquea la pestaña

El backtest corre en el hilo principal. Con la memoización añadida, 2.000
afiliados tardan ~4,3 s; el botón de 20.000 deja la pestaña insensible unos
segundos. Está declarado en la propia interfaz («la pestaña puede quedar
insensible»), pero si el jurado lo pulsa en medio de la demo la sensación es de
cuelgue.

Dos salidas, en orden de esfuerzo: bajar el máximo ofrecido a 5.000, o mover
`domain/lab.js` a un Web Worker. El módulo no toca el DOM, así que la segunda es
mecánica — es exactamente el beneficio de haber separado dominio y presentación.

---

## 5. Qué no está probado

Las 75 pruebas cubren los dos motores: determinismo (por semilla y por hash),
política de capacidad, scorer, proyección, ventana de contacto, privacidad,
formato, valor de las fuentes exógenas y los invariantes del Laboratorio.

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
| 1 | Unificar el SMMLV entre los dos motores (§4.1) | Hoy la misma persona cae en categorías distintas según la pantalla | 15 min |
| 2 | Unificar rótulos de producto entre motores (§2.1) | «Vivienda» en una pantalla e «hipotecario» en otra | 30 min |
| 3 | Alinear nombres y edades de los perfiles demo (§2.3) | El documento y la demo deben cuadrar en pantalla | 20 min |
| 4 | Bajar el máximo del Laboratorio a 5.000 (§4.6) | Evita la sensación de cuelgue en vivo | 5 min |
| 5 | Tipografías en local (§4.3) | Hace literal la afirmación de cero dependencias | 10 min |
| 6 | Alinear el discurso de la landing con lo que existe (§2.4) | Promete bugs de UX y capa agéntica que la app no tiene | 45 min |

Todo suma menos de dos horas y es puro cierre de coherencia: no hay que
construir nada nuevo. El mockup de WhatsApp —que en la versión anterior de este
informe era la prioridad— ya está hecho: llegó en `origin/main` y ahora vive en
la miniatura de la ficha y en el mockup de cierre del simulador.

---

## 6 bis. La integración con `origin/main`

El refactor se hizo sobre `edd36b4`, y mientras tanto en `origin/main` habían
entrado **12 commits** que reescribieron `index.html` (+752 líneas). Un push
directo habría borrado trabajo real. Lo que se hizo en su lugar:

1. El refactor se aisló en la rama `refactor/estructura-modular`.
2. Se hizo `merge` de `origin/main`. Solo `index.html` entró en conflicto; las
   cinco imágenes nuevas se integraron solas.
3. El conflicto se resolvió conservando la estructura modular y **portando a
   módulos todo lo que había en `origin/main`**:

| Traído de `origin/main` | Dónde vive ahora |
|---|---|
| Motor avanzado (`decidirAvanzado`, `enriquecer`, `deliberar`, `viabilidad`, `ventana`, `entrega`, `redactar`, `confianza`) | `assets/js/domain/advanced/` (8 módulos) |
| Laboratorio (`verdad`, `lineaBase`, `correrLab`) | `assets/js/domain/lab.js` |
| Simulador interactivo | `assets/js/ui/views/simulator.js` |
| Comparador de perfiles | `assets/js/ui/views/comparator.js` |
| Laboratorio de evidencia | `assets/js/ui/views/lab.js` |
| Cumplimiento del reto | `assets/js/ui/views/challenge.js` |
| Arquitectura | `assets/js/ui/views/architecture.js` |
| Miniatura del mensaje al afiliado | `ui/views/affiliate.js` · `messagePreview()` |
| Monto por determinación en el lote | `ui/views/batch.js` |
| Catálogo de 5 productos | `core/catalog.js` |
| `arq.jpeg`, `cierre_1-3.png`, `reto_referencia.jpg` | `assets/img/` |

**Verificación de que el port es fiel:** se extrajo el motor de
`origin/main:index.html`, se ejecutó en Node y se comparó con el motor
modularizado perfil por perfil. **220 de 220 decisiones idénticas** en producto,
veredicto, monto, cuota, confianza, canal, ventana, puntaje y los tres puntos de
la proyección.

Durante la comparación apareció una diferencia real —`origin/main` había quitado
el bonus de +6 por estacionalidad en el escenario «esperar»— y se alineó. Sin la
comparación automática habría pasado inadvertida.

Mejora añadida en el camino: `advanced/profile.js` memoiza los perfiles. Es una
función pura, así que el resultado no cambia, pero el Laboratorio pasó de 7,1 s
a 4,3 s con 2.000 afiliados. Aun así, el botón de 20.000 deja la pestaña
insensible unos segundos: está declarado en la propia interfaz, y la salida
definitiva sería un Web Worker.

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
