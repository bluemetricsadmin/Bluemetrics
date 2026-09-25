# Reporte: Factores de los Puntos de Medición (Gas)

Fecha: 2026-09-24
Archivos explorados:
- `src/pages/AddWeeklyGasReadingsPage.jsx`
- `src/pages/AddMonthlyGasReadingsPage.jsx`

## 1. Dónde vive la sección de factores

No existe una sección única de factores. El diccionario `gasFactors` está **duplicado** dentro de cada página, en dos funciones distintas:

| Página | Ubicación | Función | Línea del diccionario |
|---|---|---|---|
| AddWeeklyGasReadingsPage.jsx | Cálculo al subir Excel | `handleExcelUpload` | 317 |
| AddWeeklyGasReadingsPage.jsx | Recálculo al editar lectura | `handleReadingChange` | 576 |
| AddMonthlyGasReadingsPage.jsx | Cálculo al subir Excel | `handleExcelUpload` | 337 |
| AddMonthlyGasReadingsPage.jsx | Recálculo al editar lectura | `handleReadingChange` | 608 |

La fórmula aplicada en todos los casos es la misma:

```
consumo = (lecturaActual - lecturaAnterior) * factor
```

Además existe una **segunda pasada** para `wellness_general_calefaccion`, que le resta el consumo de `wellness_supersalads`:

```
consumo[wellness_general_calefaccion] -= consumo[wellness_supersalads]
```

- Weekly: `AddWeeklyGasReadingsPage.jsx:410-416`
- Monthly: `AddMonthlyGasReadingsPage.jsx:432-438`

> Nota: el punto `wellness_general_calefaccion` está definido en
> `src/lib/gas-consumption-points.json:462` como
> `"Wellness General (Calefacción)"`, tipo `calefaccion`, unidad `m³`.

## 2. ⚠️ Factor resaltado: `wellness_general_calefaccion`

Este factor es **inconsistente entre las cuatro definiciones**:

| # | Archivo | Función | Línea | Valor |
|---|---|---|---|---|
| 1 | AddWeeklyGasReadingsPage.jsx | `handleExcelUpload` | 379 | **1.2** |
| 2 | AddWeeklyGasReadingsPage.jsx | `handleReadingChange` | 638 | 1 |
| 3 | AddMonthlyGasReadingsPage.jsx | `handleExcelUpload` | 399 | 1 |
| 4 | AddMonthlyGasReadingsPage.jsx | `handleReadingChange` | 670 | 1 |

- Valor **actual** usado al procesar el Excel semanal: **`1.2`**
- Valor **anterior / resto de casos**: `1`

### Implicación

Para la misma lectura, el consumo semanal se calcula multiplicando por `1.2` al subir el Excel,
pero si el usuario edita manualmente la lectura después, el recálculo usa `1`, produciendo un
resultado distinto (20% menor). Además, la edición recalculada de `wellness_supersalads`
(`handleReadingChange`) aplica la fórmula con `1` para WGC, mientras el guardado inicial usó `1.2`.

### Comparación rápida (wellness)

| Punto | Weekly upload | Weekly edit | Monthly upload | Monthly edit |
|---|---|---|---|---|
| `wellness_acometida_digital` | 1 | 1 | 1 | 1 |
| `wellness_acometida_analogica` | 1.2 | 1.2 | 1.2 | 1.2 |
| `wellness_supersalads` | 1.2 | 1.2 | 1.2 | 1.2 |
| **`wellness_general_calefaccion`** | **1.2** | **1** | **1** | **1** |
| `wellness_calentador_sotano_regaderas` | 1 | 1 | 1 | 1 |
| `wellness_alberca` | 1 | 1 | 1 | 1 |

## 3. Tabla completa de factores (valores comunes)

Salvo `wellness_general_calefaccion`, el resto de los factores coincide en las cuatro
definiciones. Se listan a continuación.

### Acometidas y campus

| Punto | Factor |
|---|---|
| `campus_acometida_principal_digital` | 1 |
| `campus_acometida_principal_analogica` | 2.44 |
| `estudiantes_acometida_principal_digital` | 1 |
| `estudiantes_acometida_principal_analogico` | 1.54 |
| `estadio_borrego_acometida_digital` | 1 |
| `estadio_borrego_acometida_analogica` | 1.16 |
| `wellness_acometida_digital` | 1 |
| `wellness_acometida_analogica` | 1.2 |
| `campus_norte_acometida_externa` | 1.14 |
| `campus_norte_acometida_interna` | 1.14 |

### Calderas y calefacción

| Punto | Factor |
|---|---|
| `caldera_1_leon` | 2.34 |
| `caldera_2` | 0.98 |
| `caldera_3` | 2.34 |
| `mega_calefaccion_1` | 2.34 |
| `mega_calefaccion_2` | 2.34 |
| `mega_calefaccion_3` | 2.34 |
| `mega_calefaccion_4` | 2.34 |
| `mega_calefaccion_5` | 2.34 |
| `calefaccion_1_bryan` | 2.34 |
| `calefaccion_2_aerco` | 2.34 |
| `campus_norte_edificio_d_calefaccion` | 0.97 |
| `residencias_abc_calefaccion` | 1.52 |
| `biotecnologia` | 2.34 |

### Alimentos y restaurantes

| Punto | Factor |
|---|---|
| `domo_cultural` | 2.34 |
| `centrales_local` | 2.34 |
| `dona_tota` | 2.34 |
| `chilaquiles_tec` | 1 |
| `carls_junior` | 2.34 |
| `comedor_centrales_tec_food` | 2.34 |
| `davilas_grill_team` | 1 |
| `pizza_little_caesars` | 1 |
| `ciap_super_salads` | 2.34 |
| `nikkori` | 9.86 |
| `nectar_works` | 9.86 |
| `sr_latino` | 2.34 |
| `arena_borrego` | 2.34 |
| `la_dia` | 2.34 |
| `expedition` | 2.34 |
| `bread_expedition` | 2.34 |
| `matthew_expedition` | 2.34 |
| `comedor_estudiantes` | 0.98 |
| `campus_norte_comedor_d` | 0.97 |
| `pabellon_tec_cocina_estudiantes_2do_piso` | 1.48 |
| `residencias_abc_locales_comida` | 1 |

### Residencias y otros

| Punto | Factor |
|---|---|
| `cedes` | 0.98 |
| `cedes_trabajadores_vestidores` | 0.98 |
| `residencias_1` | 0.98 |
| `residencias_2` | 0.98 |
| `residencias_3` | 1.52 |
| `residencias_4` | 0.98 |
| `residencias_5` | 0.98 |
| `residencias_7` | 0.98 |
| `residencias_8` | 0.98 |
| `residencias_abc_regaderas` | 1.52 |
| `aulas_1` | 2.34 |
| `aulas_4` | 2.34 |
| `aulas_7` | 2.34 |
| `biblioteca` | 2.34 |
| `centro_congresos_vestidores` | 1.01 |
| `jubileo` | 0.94 |
| `estadio_yarda` | 1 |
| `wellness_supersalads` | 1.2 |
| `wellness_calentador_sotano_regaderas` | 1 |
| `wellness_alberca` | 1 |
| `auditorio_luis_elizondo` | 1 |
| `pabellon_tec_semillero` | 1 |
| `guarderia` | 1 |
| `escamilla` | 1 |
| `casa_solar` | 1 |
| `estudiantes_11` | 1 |
| `estudiantes_12` | 1 |
| `estudiantes_13` | 1 |
| `estudiantes_15_y_10` | 1 |

## 4. Recomendación

Unificar `wellness_general_calefaccion` en un único valor. Si el valor vigente debe ser
**1.2**, actualizar las cuatro definiciones (weekly edit:638, monthly upload:399, monthly edit:670)
para evitar que la edición manual sobrescriba el cálculo con `1`. Idealmente, extraer
`gasFactors` a un módulo compartido (p. ej. `src/lib/gasFactors.js`) para eliminar las 4 copias.
