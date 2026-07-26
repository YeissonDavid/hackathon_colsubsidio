# Registro de cambios

## [5.0.0] — 26 de julio de 2026

Reestructuración completa de la base de código. **El comportamiento del motor no
cambia:** se verificó que las 220 decisiones son idénticas a las de la versión
anterior. Detalle completo en [`docs/MEJORAS.md`](docs/MEJORAS.md).

### Estructura

- `index.html` pasa de 68.595 bytes en 22 líneas (tres de ellas de más de 15.000
  caracteres) a 179 líneas de markup semántico, sin CSS ni JavaScript embebidos.
- CSS separado en 5 capas: `tokens` → `base` → `layout` → `components` → `views`.
- JavaScript separado en 27 módulos bajo `assets/js/{core,domain,ui}`.
- `pitch.html` con su CSS y su JS en archivos propios.
- Assets de marca consolidados en `assets/brand/`.

### Añadido

- Suite de 51 pruebas sin dependencias (`tests/index.html` o
  `node tests/run-node.js`): determinismo, política de capacidad, scorer,
  proyección, ventana de contacto, privacidad y formato.
- `docs/ARCHITECTURE.md` y `docs/MEJORAS.md`.
- `.editorconfig` y `.gitattributes`.
- Variante de marca estricta: `data-brand="oficial"` en `<html>` conmuta el
  acento al amarillo exacto del manual de Colsubsidio.
- Enmascaramiento de correo electrónico.

### Corregido

- **La ficha del afiliado mostraba nombre, cédula y correo sin enmascarar**, pese
  a que la documentación afirmaba lo contrario. Era la pantalla que se proyecta en
  la demostración.
- Alternar «Ocultar PII» expulsaba al analista de la ficha a la bandeja.
- El pie de página con los créditos del equipo solo se veía en la bandeja.
- Las iniciales del avatar lanzaban `TypeError` con nombres de una sola palabra.
- Los colores de las series del gráfico se pasaban como `var()` dentro de
  atributos de presentación SVG, lo que no es fiable entre navegadores; ahora se
  aplican por clase CSS.
- Escape de HTML aplicado de forma inconsistente: cédula, correo y tipo de
  contrato se insertaban en crudo.
- La simulación del lote seguía corriendo tras cambiar de vista, y dos clics
  seguidos dejaban dos intervalos compitiendo por la misma barra.
- Los botones del CTA de `pitch.html` no tenían comportamiento.
- El logotipo del pie de `pitch.html` apuntaba a una ruta inexistente.

### Eliminado

- `update_2.py` y `update_html.py`: parcheaban `index.html` con búsqueda y
  reemplazo de texto y fueron la causa de dos commits de corrección de sintaxis.
- Código muerto en la proyección: la serie «esperar» se calculaba dos veces y la
  primera se descartaba.
- Todos los manejadores de eventos en atributos HTML (`onclick`, `onchange`).
- `DOCUMENTATION.md`, reemplazado y ampliado por `docs/ARCHITECTURE.md`.
- `Margie/` (a petición del equipo). Ver `docs/MEJORAS.md §7`: contenía el
  documento maestro y hay copia de respaldo.

### Pendiente de decisión (no es código)

- Catálogo de productos: el documento maestro y `avance.md` describen dos
  conjuntos de 7 líneas distintos.
- Nombre del producto: la aplicación dice ORIGEN, la landing dice Kepler.
- Nombres y edades de los perfiles demo, que no coinciden con el documento maestro.
- Valor del SMMLV, fijado a mano en `assets/js/core/config.js`.
