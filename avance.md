# Avance — Reto Crédito Hiperpersonalizado (23-jul-2026)

Detalle completo y fuentes en `cnoslidado-estrategia.md` (documento maestro). Esto es solo el resumen rápido para el equipo.

## Hecho

**Frente A — Segmentación (MCA + LCA):** corrido sobre las 1,566,026 filas reales. K=12 clases,
elegido con evidencia (BIC/SABIC/entropía, no a ojo — ver §5.1.1). Cada clase tiene perfil real y
nombrado (edad, género, categoría de ingreso, situación familiar). Ninguna clase degenerada (la más
chica es 1.3% de la base).

**Frente B — Enriquecimiento exógeno, 4 familias completas (§5.2.1):**
1. **Canal de entrega** — WhatsApp primero para casi todas las clases (dato real: open rate
   85-98% vs. push 20-40% vs. email 20-25%); solo el segmento de mayores de 55 (pensionados)
   descarta push por alta tasa de deshabilitación.
2. **Vector de interés** — síntesis razonada (edad+familia+ingreso reales + investigación Raddar/Gen
   Z Colombia citada), con nivel de confianza declarado por clase.
3. **Sensibilidad macro** — calibrada con dato real DANE (gasto en alimentos por nivel
   socioeconómico), no con pesos a ojo. Tasa BanRep 12%, inflación 5.8%→6.4% proyectada 2026.
4. **Demanda de calendario** — prima (30-jun/20-dic), vacaciones escolares, regreso a clases.

**Scorer aditivo glass-box (§5.4):** arma, por clase, 1-3 productos elegibles (nunca un número
forzado) con razones nombradas y trazables a las 4 tablas de arriba. Incluye elegibilidad real de
libranza (Ley 1527/2012 — Facultativos/Independientes quedan fuera de Libre Inversión, correcto).

## Decisiones tomadas en el camino (para que el equipo esté alineado)

- **Monto: fuera de alcance de este demo.** El scorer no calcula montos — solo producto(s)
  elegible(s) + sub-producto + razones. Monto depende de datos que no tenemos para varios productos
  (valor de vivienda, costo de programa educativo, deuda existente en otras entidades) o requeriría
  sobre-ingeniería para lo que da tiempo.
- **Catálogo final: 7 líneas** (Hipotecario, Consumo general —incluye lo que antes era Crédito
  Mujer/oncológica—, Libre Inversión, Educativo, Rotativo cupo, Rotativo seguros/impuestos, Compra
  de cartera). De estas 7, el scorer hoy solo conecta señal real a 5 — **Consumo general y Rotativo
  seguros/impuestos no tienen señal mapeada todavía y nunca van a aparecer como resultado.** Decisión
  explícita: se deja así por ahora, no se prioriza cerrar ese hueco todavía.

## Qué falta

- Política de canal/timing + capa agéntica (LLM que decide cómo comunicar) — §5.5-5.6, no iniciado.
- World State contexto actual ara enriquecer segmento por canal
- Hacer demo con interfaz y arqutecura parecidas a las de saleforce para demo