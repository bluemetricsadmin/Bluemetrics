# Documentación de Fórmulas de Cálculo de Consumo

**Fecha:** Agosto 2026
**Módulo:** Lecturas de Agua (Diarias, Semanales y Mensuales)

---

## 1. Fórmula general aplicada a pozos normales

Para la inmensa mayoría de puntos de medición (pozos normales, zonas y general), el consumo se calcula como la **diferencia entre la lectura actual y la lectura del período anterior**, opcionalmente multiplicada por un **factor de medidor**:

```
Consumo = (LecturaActual − LecturaAnterior) × Factor
```

Donde:
- **LecturaActual**: lectura en m³ subida en el Excel del período vigente.
- **LecturaAnterior**: lectura en m³ del período inmediato anterior.
- **Factor**: multiplicador del medidor; es `1` por defecto.

## 2. Puntos que usan un factor diferente de 1

### 2.1 Agua Semanal y Mensual (factor ×10)

Solamente **4 puntos** tienen factor `10` en las lecturas **semanales y mensuales de agua** (`AddWeeklyReadingsPage.jsx` y `AddMonthlyWaterReadingsPage.jsx`):

| Punto | Factor |
|---|---|
| `circuito_6_residencias` | 10 |
| `circuito_8_campus` | 10 |
| `medidor_general_pozos` | 10 |
| `campo_soft_bol` | 10 |

Cualquier otro punto usa factor `1`.

### 2.2 Agua Diaria

En las lecturas **diarias** (`AddDailyReadingsPage.jsx`) **todos** los puntos usan factor `1` (no existe tabla de factores especiales).

### 2.3 Gas Semanal y Mensual (referencia, no agua)

Las lecturas de gas (semanal y mensual) sí manejan una tabla grande de factores por medidor (`gasFactors`: ej. 2.44, 2.34, 0.98, 1.52, 9.86…), pero los factores de gas **no se aplican al agua**.

---

## 3. Comparativa por período (agua)

| Aspecto | Diario | Semanal | Mensual |
|---|---|---|---|
| **Fórmula base** | `LecturaActual − LecturaAnterior` | `(LecturaActual − LecturaAnterior) × Factor` | `(LecturaActual − LecturaAnterior) × Factor` |
| **Factores ≠ 1** | Ninguno | 4 puntos con ×10 | 4 puntos con ×10 |
| **Ajustes por resta de otros consumos** | No | Sí | Sí |
| **Lectura anterior consultada de** | Último registro previo del mismo `mes_anio` (tabla `lecturas_diarias`) | Semana `N−1` (misma tabla) o última semana del año anterior si es semana 1 | Mes `M−1` (misma tabla) o diciembre del año anterior si es enero |
| **Almacenamiento** | Solo tabla de lecturas (consumo se calcula en pantalla) | Tablas `lecturas` y `lecturas_consumo` (upsert) | Tabla objetivo: ambas / solo lecturas / solo consumo |

> **Conclusión:** la fórmula **semanal y mensual de agua son idénticas**; la **diaria es un subconjunto** (sin factor y sin ajustes).

---

## 4. Proceso completo de cálculo en Semanal y Mensual de Agua (casos especiales)

Este proceso se ejecuta en dos pasadas y está implementado de forma **idéntica** en:
- `src/pages/AddWeeklyReadingsPage.jsx` (sección cálculo, alrededor de línea 452)
- `src/pages/AddMonthlyWaterReadingsPage.jsx` (sección cálculo, alrededor de línea 308)

### 4.1 Primera pasada — Consumo base

Para cada punto habilitado (que no tenga `noRead = true`):

```
ConsumoBase = (LecturaActual − LecturaAnterior) × Factor
```

- Si no existe lectura actual o no existe período anterior, el punto **no recibe consumo**.
- `Factor` proviene de `specialCases` (por defecto `1`).

### 4.2 Segunda pasada — Resta de consumos de submedidores (casos especiales)

Existe un mapa `adjustmentMap` que define, para ciertos puntos "fórmula", **qué consumos de otros puntos se deben restar**:

```
ConsumoFinal = ConsumoBase(punto) − Consumo(factorId1) − Consumo(factorId2)…
```

Los **factores restados siempre son consumos ya calculados** (diferencia × su propio factor) del mismo período, nunca lecturas crudas.

### 4.3 Tabla de casos especiales (agua semanal y mensual)

| Punto medido (fórmula) | Se le resta el consumo de |
|---|---|
| `residencias_10_15` | `caffenio` |
| `estadio_banorte` | `estadio_azul` |
| `estadio_banorte_purgas` | `wellnes_te_purga` |
| `aulas_4_sur` | `cdi_1` |
| `aulas_4_maestros` | `cdi_2` |
| `nucleo` | `expedition` + `hub` |
| `aulas_3` | `basanti` + `aulas_3_sr_latino` |

### 4.4 Dónde se aplica

1. **Al procesar el Excel** (`handleExcelUpload`): primero se calcula `ConsumoBase` para todos los puntos, y después se recorre `adjustmentMap` restando los consumos de los factores sobre los puntos fórmula.
2. **Al editar una lectura manualmente** (`handleReadingChange`):
   - Si el punto editado **es una fórmula**, se recalcula su consumo restando sus factores.
   - Si el punto editado **es un factor** de alguna fórmula, se **recalcula la fórmula completa** que depende de él (para que la resta refleje el nuevo valor).

### 4.5 Ejemplo ilustrativo

Para `residencias_10_15` (periodo semanal N):

```
C(residencias_10_15) = (lectura_N − lectura_N−1) × 1
C(caffenio)          = (lectura_N − lectura_N−1) × 1
C_final(residencias_10_15) = C(residencias_10_15) − C(caffenio)
```

Para `nucleo` (periodo mensual M):

```
C(nucleo)          = (lectura_M − lectura_M−1) × 1
C(expedition)      = (lectura_M − lectura_M−1) × 1
C(hub)             = (lectura_M − lectura_M−1) × 1
C_final(nucleo)    = C(nucleo) − C(expedition) − C(hub)
```

---

## 5. Nota sobre el medidor general de pozos

`medidor_general_pozos` (con factor ×10) participa en el cálculo como cualquier punto: su consumo es `(lectura_actual − lectura_anterior) × 10`. Además es usado por el módulo de **predicción** (`syncPredictionToSheet` en semanal de agua) como `medidor_general` para sincronizar consumo + predicción hacia el Google Sheet externo. **No existe un "pozo externo" que intervenga en el cálculo de consumo.**