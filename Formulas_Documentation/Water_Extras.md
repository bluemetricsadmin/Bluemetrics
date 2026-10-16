# Fórmulas de Agua extra

Fórmulas que existen en el código de las vistas de lecturas de agua pero que **no** aparecen en `Formulas agua y gas _final` proprocionado por el cliente.
Se mantienen tal cual y se documentan aquí.

## Fórmulas

$$
\text{Estadio Borregos (purga T.E.)} = \text{Estadio Borregos (purga T.E.)} - \text{Wellness (purga T.E.)}
$$

$$
\text{Residencias 10 y 15} = \text{Residencias 10 y 15} - \text{Caffenio}
$$
(Las formula de Residencias 10 y 15, Estadio Borregos(purga T.E.) se implementaron el 03/06/2026, equivalente a semana 23-2026, estando vigente hasta la fecha)

## Mapeo a IDs

| Fórmula | id resultado | id(s) restado(s) |
| --- | --- | --- |
| Estadio Borregos (purga T.E.) − Wellness (purga T.E.) | `estadio_banorte_purgas` | `wellness_te_purga` |
| Residencias 10 y 15 − Caffenio | `residencias_10_15` | `caffenio` |

## Factores actualizados

Factores `specialCases` que estaban documentados en `Formulas agua y gas _final` pero no implementados en el código, y ahora se aplicaban correctamente.

| id | name | factor | estado |
| --- | --- | --- | --- |
| `residencias_13_2_ciudad` | Estudiantes Residencias 13-2 (Ciudad) (Respaldo) | 10 | agregado (antes 1) |
| `wellness_te_rebosadero` | Wellness (rebosadero T.E.) | 0.38 | agregado (antes 1) |

Factores ×10 ya existentes (sin cambios): `medidor_general_pozos`, `circuito_8_campus`, `circuito_6_residencias`, `campo_soft_bol`.

