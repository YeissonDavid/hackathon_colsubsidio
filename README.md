# ORIGEN - Crédito Hiperpersonalizado para Colsubsidio

ORIGEN es un **Motor Zero-Dependency** diseñado para empoderar a los analistas de crédito de Colsubsidio, convirtiendo el conocimiento del afiliado en decisiones financieras transparentes, explicables y centradas en la realidad de cada persona.

## 🚀 Cómo ejecutar la solución (Zero-Dependency)

Cumpliendo con el criterio de "ejecutar la solución en menos de 5 minutos", esta solución **no requiere instalaciones complejas**. 
No necesitas Node.js, Python, bases de datos ni conexión a APIs externas para la demostración.

**Pasos:**
1. Descarga el repositorio o haz `git clone`.
2. Haz **doble clic** en el archivo `index.html`.
3. ¡Listo! La Estación de Decisión ORIGEN se abrirá en tu navegador (Chrome, Edge, Firefox, Safari).

*Opcional: Si quieres ver el landing page de la propuesta arquitectónica, abre `pitch.html`.*

## 🧠 Características Principales

- **Determinismo y Explicabilidad (Glass-box):** No usamos cajas negras. Cada recomendación de crédito se basa en un sistema de puntaje (scorer) aditivo y trazable. El analista y el afiliado saben *exactamente* por qué se recomendó un producto.
- **Ruta de Bienestar:** ORIGEN entiende que la mejor decisión financiera a veces es no prestar hoy. Si el endeudamiento supera los topes sanos, sugiere automáticamente una ruta de acompañamiento a 6 meses.
- **Timing y Canal Inteligente:** El motor genera un *Heatmap* de actividad para deducir la ventana óptima de contacto y elige dinámicamente entre WhatsApp, Email o Push notification, dependiendo del segmento y el producto.
- **Cero Datacrédito:** La solución infiere las obligaciones costosas externas a partir del comportamiento de pago y el perfil de gasto del afiliado, cumpliendo estrictamente con las restricciones del reto.

## 📁 Estructura del Repositorio

- `index.html`: La Estación de Decisión de ORIGEN (El Dashboard funcional).
- `pitch.html`: Landing page conceptual de Kepler/Origen.
- `SPEC.md`: Documento de especificación de requerimientos según el estándar exigido por Colsubsidio.
- `README.md`: Este archivo.
- `Recursos Marca Colsubsidio/`: Documentos y assets oficiales del manual de marca de la Caja (aplicados estrictamente en el CSS de `index.html`).

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3 nativo (CSS Variables adaptadas al Manual de Marca oficial: `#ffd000`, `#0067b1`, `#575756`).
- **Lógica Core:** Vanilla JavaScript ES6+.
- **Generación de Datos:** Simulador determinístico integrado en el frontend (Generación de población sintética calibrada en memoria).
