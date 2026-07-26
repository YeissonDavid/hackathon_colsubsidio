# Documentación Técnica y de Negocio - ORIGEN

## 1. Visión General
**ORIGEN** es el Copiloto de Deliberación Financiera desarrollado para **Colsubsidio y 30X**. Su objetivo es empoderar a los analistas de crédito convirtiendo la inmensa huella transaccional del afiliado en decisiones financieras precisas, justas y altamente personalizadas en tiempo real. 

A diferencia de los enfoques tradicionales que venden deudas genéricas, ORIGEN recomienda la solución de crédito exacta para el momento de vida del afiliado (formación de hogar, crianza, etc.), maximizando la conversión y el Life-Time Value (LTV).

## 2. Arquitectura "Zero-Dependency"
El proyecto ha sido diseñado deliberadamente bajo el paradigma **Zero-Dependency**. 
- **Tecnologías:** HTML5, CSS3, Vanilla JavaScript.
- **Despliegue:** No requiere Node.js, bases de datos complejas ni servidores de backend pesados para operar su capa de presentación y simulación. 
- **Ventaja de Negocio (Time-to-Market):** Puede ser ejecutado dando doble clic al archivo `index.html` o embebido como un WebView/SDK ligero en cualquier sistema Core Bancario *legacy*, permitiendo un despliegue inmediato en las tablets de los asesores.

## 3. Módulos Core del Sistema

### 3.1 Motor Determinístico y Algoritmo Ético
ORIGEN no utiliza modelos estocásticos de Inteligencia Artificial (cajas negras) para aprobar o rechazar créditos, ya que esto representa un riesgo regulatorio y de cumplimiento frente a la Superintendencia Financiera. En su lugar, emplea un **Motor Determinístico**:
- **Trazabilidad Matemática:** Cada peso de capacidad de endeudamiento y cada punto del *scoring* puede ser rastreado hasta su regla de origen.
- **Inclusión Financiera:** El modelo califica variables de comportamiento no tradicionales (ingresos no bancarizados, uso frecuente de la red de Colsubsidio, etapa de vida).
- **Scoring Multiproducto:** Evalúa simultáneamente 7 líneas de crédito (Cupo Rotativo, Compra de Cartera, Hipotecario, Educativo, Crédito Mujer, Seguros y Complementario) y elige la de mayor impacto positivo para el afiliado.

### 3.2 Proyección de Bienestar a 12 Meses
El algoritmo no solo mira la foto de hoy, sino que proyecta 3 rutas a 12 meses:
1. **Otorgar ahora:** Impacto del crédito si se desembolsa hoy.
2. **Esperar al mejor momento:** Proyección si el cliente espera a liberar capacidad (ej. terminando de pagar una obligación externa).
3. **No viable (Ruta de bienestar):** Si el crédito sobrepasa la política de riesgo, el motor activa protocolos de acompañamiento humano en lugar de endeudamiento destructivo.

### 3.3 Privacy by Design (Seguridad y Ley 1581)
Preparado para procesar a millones de afiliados de forma segura:
- **Enmascaramiento Nativo:** El código integra un módulo de ocultamiento de PII (Personally Identifiable Information). Las cédulas (`*** ***`) y los nombres (`L**** M*****`) se censuran en el renderizado inicial.
- **Tokenización Front-End:** El motor procesa variables numéricas de forma anónima. La información sensible se puede mantener enmascarada hasta que el asesor comercial realmente lo requiera y obtenga validación biométrica o de token.
- **Cumplimiento:** Cero exposición accidental de datos sensibles en pantallas compartidas o redes públicas.

## 4. Estructura de Interfaz (UI/UX)
El diseño respeta el manual de marca estricto de Colsubsidio:
- **Colores:** Amarillo Base (`#ffd000`), Azul Base (`#0067b1`), Grafito Base (`#575756`).
- **Componentes:** 
  - Bandeja principal de evaluación de lotes (Dashboard).
  - KPI Dinámicos y Filtros en tiempo real.
  - Gráficos de Proyección SVG generados matemáticamente sin librerías externas (como Chart.js o D3).
  - Botón de WhatsApp integrado para cerrar el flujo de comunicación multicanal.

## 5. Instrucciones de Ejecución
1. Descarga o clona el repositorio: `git clone https://github.com/YeissonDavid/hackathon_colsubsidio.git`
2. Abre la carpeta del proyecto.
3. Haz doble clic en `index.html` para abrirlo en cualquier navegador web moderno (Chrome, Edge, Safari, Firefox).
4. *(Opcional)* Activa/Desactiva el modo privacidad (Ocultar PII) en la parte superior derecha de la interfaz.

---
*Desarrollado para la Hackathon de Colsubsidio y 30X - Julio 2026*
