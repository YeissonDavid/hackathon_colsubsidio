# Especificación de Requerimientos - ORIGEN

## 1. Qué hace
**ORIGEN** es un motor de perfilamiento y toma de decisión de crédito ("Estación de Decisión") orientado a los analistas de Colsubsidio. Consolida la huella transaccional, demográfica y el momento de vida del afiliado para calcular de forma determinística la viabilidad financiera y recomendar el producto de crédito óptimo (Cupo Rotativo, Consumo, Hipotecario, Mujer, Educativo). Además, predice la ventana horaria y canal de contacto de mayor conversión.

## 2. Qué NO hace
- **No es una app orientada al usuario final (Afiliado).** ORIGEN es una herramienta de back-office ("Copiloto") para el equipo de originación y colocación de crédito de la Caja.
- **No consulta Datacrédito en tiempo real (Cero Datacrédito).** Infiere las obligaciones financieras de otras entidades a partir de la capacidad de ahorro y variables demográficas.
- **No toma decisiones estocásticas ("Caja Negra").** No utiliza LLMs para decidir si se otorga o no un crédito, garantizando que el motor sea auditable y libre de alucinaciones.

## 3. Usuario y momento
- **Usuario Primario:** Analista / Gestor de Crédito de Colsubsidio.
- **Usuario Secundario:** Equipo de campañas de Marketing Financiero.
- **Momento:** Cuando se necesita pre-aprobar bases masivas de afiliados (Procesamiento por lote) o cuando un analista atiende un caso complejo (Bandeja de decisión individual) y requiere una recomendación explicable en menos de 1 minuto sin hacer trámites engorrosos.

## 4. Flujo en 5 pasos
1. **Ingreso:** El analista busca una cédula o carga un archivo CSV (Lote) en el panel `index.html`.
2. **Enriquecimiento:** El motor procesa variables exógenas (RUES, uso de la red Colsubsidio, momento de vida).
3. **Deliberación de Portafolio:** El motor evalúa los 7 productos de Colsubsidio aplicando reglas estrictas de capacidad y vinculación.
4. **Proyección (Bienestar):** Se simula el bienestar financiero a 12 meses. Si la capacidad está excedida, el sistema bloquea el desembolso y activa la "Ruta de Bienestar" (recalificación a 6 meses).
5. **Resolución:** El motor devuelve el monto sugerido, el canal de contacto ideal (ej: WhatsApp) y la franja horaria de mayor conexión del afiliado (ej: Martes 19:00).

## 5. 3 Criterios de aceptación
1. **Zero-Dependency (Ejecución):** El sistema debe arrancar haciendo doble clic en `index.html` sin necesidad de dependencias (Node.js, Docker, bases de datos), ejecutándose por completo en el navegador.
2. **Determinismo:** Para el mismo perfil con las mismas variables de entrada, el sistema **siempre** debe arrojar exactamente el mismo puntaje, producto sugerido y proyección a 12 meses.
3. **Explicabilidad Visual:** La resolución debe mostrar gráficamente por qué un crédito fue preferido sobre otro (barras de contribución al score) y el cálculo de la capacidad de pago antes y después de la resolución.

## 6. Datos que toca
- Datos transaccionales del ecosistema Colsubsidio (Boletería, turismo, salud).
- Edad, composición familiar, ingresos.
- **Base legal:** Todo cálculo de variables exógenas se hace basándose en la *Ley 1581 de 2012 (Hábeas Data)* para datos de contacto y consentimiento, y la *Ley 1266 de 2008* para la inferencia de data alternativa y financiera. (Los consentimientos requeridos se muestran de forma explícita en la pestaña "Fuentes y consentimiento" de la aplicación).

## 7. Supuestos por validar
- **Generación determinística de la información (World Loop):** Para efectos de la demostración y cumplir con el Zero-Dependency, ORIGEN utiliza una población sintética (mock data) calibrada usando un generador de semillas pseudoaleatorio matemático. Esto significa que **la data es estática y reproducible (determinística) en cada carga de la página**, permitiendo a los jueces auditar siempre los mismos resultados de los perfiles demo (como "María" o "Carlos"). Se asume que, en fase de producción, este generador local será reemplazado de manera transparente (Drop-in replacement) por las APIs reales de Colsubsidio.
- **Topes de momento de vida:** Asumimos que los porcentajes máximos de endeudamiento sugeridos (ej. 32% en Consolidación, 22% en Inicio laboral) están alineados a las políticas de riesgo actuales de Colsubsidio. Deberán calibrarse con la matriz de riesgo del Banco.
