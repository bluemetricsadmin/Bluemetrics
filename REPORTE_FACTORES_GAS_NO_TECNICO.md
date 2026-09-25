# Factores de Cálculo del Consumo de Gas

**Guía explicativa (no técnica)**

Fecha: 24 de septiembre de 2026

---

## ¿Qué es un "factor de cálculo"?

Cuando un medidor registra gas, la lectura que muestra **no siempre equivale directamente a los metros cúbicos (m³) que realmente se consumieron**. Algunos medidores miden en unidades distintas o requieren un ajuste para reflejar el consumo real.

El **factor de cálculo** es el número por el que se multiplica la diferencia de lecturas para obtener el consumo real.

Dicho de forma sencilla:

> **Consumo = (lectura de este periodo − lectura del periodo anterior) × factor del punto**

Ejemplo práctico: si un medidor pasó de 100 a 150 (diferencia de 50) y su factor es 2, el consumo real es **100 m³**, no 50.

Los factores se aplican tanto a las **lecturas semanales** como a las **mensuales**.

---

## ¿Por qué los factores son tan variados?

Cada punto de medición puede tener un factor distinto según:

- El **tipo de medidor** (digital o analógico).
- El **tipo de instalación** (caldera, restaurante, acometida principal, residencia, etc.).
- Cómo fue **calibrado o instalado** el equipo.

Por eso conviven valores como `1` (medidor que ya entrega m³ directos), `2.34` (ajustes comunes en calderas y restaurantes), `9.86` (medidores con escalas especiales) o `0.94` (factores menores a 1).

La mayoría de los puntos usan factores cercanos a **1**, **2.34** o **1.2**; unos pocos usan valores muy distintos.

---

## Puntos clave del reporte

### ⭐ El caso a resaltar: `wellness_general_calefaccion`

Este es el punto **"Wellness General (Calefacción)"**.

| Situación | Factor que se aplica hoy |
|---|---|
| Al cargar el Excel de lecturas **semanales** | **1.2** |
| Al cargar el Excel de lecturas **mensuales** | 1 |
| Al **editar manualmente** una lectura (semanal o mensual) | 1 |

**En palabras simples:** el mismo punto se calcula de dos maneras distintas según cómo se carguen los datos.

- Si los datos vienen del Excel semanal, el consumo se multiplica por **1.2**.
- Si los datos vienen de un Excel mensual o si alguien corrige una lectura a mano, el consumo se multiplica por **1**.

Esto provoca que, **para exactamente las mismas lecturas, el consumo reportado cambie hasta un 20 %** según el camino que se use. Es decir, el mismo medidor puede mostrar un consumo más alto o más bajo sin que la lectura física haya cambiado.

### Detalle de la familia Wellness

Todos los valores de esta familia, para poner el caso en contexto:

| Punto | Factor aplicado |
|---|---|
| Wellness Acometida digital | 1 |
| Wellness Acometida analógica | 1.2 |
| Wellness SuperSalads | 1.2 |
| **Wellness General (Calefacción)** | **1.2 al cargar semanal / 1 en los demás casos** |
| Wellness Calentador Sótano (Regaderas) | 1 |
| Wellness Alberca | 1 |

---

## Todos los factores por grupo

### Acometidas principales y campus

| Punto | Factor |
|---|---|
| Campus Acometida Principal digital | 1 |
| Campus Acometida Principal analógica | 2.44 |
| Estudiantes Acometida Principal digital | 1 |
| Estudiantes Acometida Principal analógico | 1.54 |
| Estadio Borrego Acometida digital | 1 |
| Estadio Borrego Acometida analógica | 1.16 |
| Wellness Acometida digital | 1 |
| Wellness Acometida analógica | 1.2 |
| Campus Norte Acometida externa | 1.14 |
| Campus Norte Acometida interna | 1.14 |

### Calderas y calefacción

| Punto | Factor |
|---|---|
| Caldera 1 León | 2.34 |
| Caldera 2 | 0.98 |
| Caldera 3 | 2.34 |
| Mega Calefacción 1 a 5 | 2.34 (cada una) |
| Calefacción 1 Bryan | 2.34 |
| Calefacción 2 Aerco | 2.34 |
| Campus Norte Edificio D calefacción | 0.97 |
| Residencias ABC Calefacción | 1.52 |
| Biotecnología | 2.34 |

### Alimentos y restaurantes

| Punto | Factor |
|---|---|
| Domo Cultural | 2.34 |
| Centrales Local | 2.34 |
| Doña Tota | 2.34 |
| Chilaquiles Tec | 1 |
| Carl's Junior | 2.34 |
| Comedor Centrales Tec Food | 2.34 |
| Dávila's Grill Team | 1 |
| Pizza Little Caesars | 1 |
| CIAP Super Salads | 2.34 |
| Nikkori | 9.86 |
| Néctar Works | 9.86 |
| Sr. Latino | 2.34 |
| Arena Borrego | 2.34 |
| La Día | 2.34 |
| Expedition | 2.34 |
| Bread Expedition | 2.34 |
| Matthew Expedition | 2.34 |
| Comedor Estudiantes | 0.98 |
| Campus Norte Comedor D | 0.97 |
| Pabellón Tec Cocina Estudiantes 2.º piso | 1.48 |
| Residencias ABC Locales de comida | 1 |

### Residencias, aulas y otros

| Punto | Factor |
|---|---|
| CEDES | 0.98 |
| CEDES Trabajadores Vestidores | 0.98 |
| Residencias 1, 2, 4, 5, 7 y 8 | 0.98 (cada una) |
| Residencias 3 | 1.52 |
| Residencias ABC Regaderas | 1.52 |
| Aulas 1 | 2.34 |
| Aulas 4 | 2.34 |
| Aulas 7 | 2.34 |
| Biblioteca | 2.34 |
| Centro de Congresos Vestidores | 1.01 |
| Jubileo | 0.94 |
| Estadio Yarda | 1 |
| Wellness SuperSalads | 1.2 |
| Wellness Calentador Sótano (Regaderas) | 1 |
| Wellness Alberca | 1 |
| Auditorio Luis Elizondo | 1 |
| Pabellón Tec Semillero | 1 |
| Guardería | 1 |
| Escamilla | 1 |
| Casa Solar | 1 |
| Estudiantes 11, 12, 13 y 15 y 10 | 1 (cada uno) |

---

## ¿Por qué importa esta inconsistencia?

- El **mismo consumo físico** puede reportarse distinto según cómo se capture el dato.
- Dificulta **comparar** semanas o meses entre sí, y comparar contra periodos anteriores.
- Puede afectar **reportes, gráficas y decisiones** basadas en el consumo.

## Recomendación

Definir **un único valor** para `wellness_general_calefaccion` y aplicarlo en todos los casos
(carga semanal, carga mensual y edición manual). Si el valor correcto es **1.2**, debe usarse
siempre ese número; si es **1**, debe corregirse la carga semanal para que coincida. Lo importante
es que **no exista más de un valor para el mismo punto**.

---

### Anexo: punto especial de cálculo

Para el punto `wellness_general_calefaccion` existe además una regla adicional: a su consumo
**se le resta el consumo de `wellness_supersalads`**. Es decir, el consumo de SuperSalads se
descuenta de General (Calefacción) para no contabilizarlo dos veces. Esta regla sí es consistente
en las versiones semanal y mensual.
