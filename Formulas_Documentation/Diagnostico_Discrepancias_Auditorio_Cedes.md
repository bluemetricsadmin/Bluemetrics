# Diagnóstico de discrepancias entre el sistema y el archivo "42_Rerportes Operativos"

**Puntos revisados:** Auditorio Luis Elizondo y Cedes Cisterna  
**Periodo revisado:** semanas 1 a 42 del año 2026  
**Fecha del diagnóstico:** 22 de octubre de 2026

---

## 1. Propósito

Este documento explica, en lenguaje sencillo, por qué los consumos que muestra el sistema no coinciden con los consumos del archivo de Excel **"42_Rerportes Operativos"** para Auditorio Luis Elizondo y Cedes Cisterna.

También documenta desde qué fechas se empezaron a aplicar las fórmulas en el sistema y cómo esas fechas afectaron los cálculos que se hicieron y editaron durante el año.

---

## 2. Resumen del hallazgo

La diferencia no se debe a que el Excel esté mal calculado. Se debe a que las fórmulas se fueron incorporando al sistema en fechas distintas y **no se aplicaron de forma retroactiva** a las semanas que ya estaban guardadas.

- **Auditorio Luis Elizondo:** el Excel aplica correctamente la fórmula durante todo el año. El sistema solo la aplicó a partir de la semana 42. Las semanas 1 a 41 quedaron guardadas sin restar el consumo de CDB2.
- **Cedes Cisterna:** el sistema y el Excel coinciden en la mayoría del año, pero el sistema dejó de restar los tres consumos internos en las semanas 38 a 41. Además, las semanas 1 a 35 quedaron sin aplicar la fórmula en ambas fuentes.
- **Causa principal:** la fórmula de Cedes se empezó a usar en las pantallas de captura el 14 de septiembre de 2026, pero en las pantallas de edición se agregó hasta el 16 de octubre de 2026. Cualquier semana editada o recalculada entre esas dos fechas quedó sin la resta correspondiente.
- **Segunda causa:** si en un archivo semanal falta la lectura de alguno de los medidores que deben restarse, el sistema omite la resta sin avisar.

---

## 3. Cómo se calcula cada consumo

### Auditorio Luis Elizondo

El consumo correcto se obtiene así:

> Consumo de Auditorio = diferencia de lecturas de Auditorio − consumo de CDB2

Es decir, primero se calcula cuánto creció la lectura de Auditorio de una semana a otra y después se le descuenta lo que corresponde a CDB2.

### Cedes Cisterna

El consumo correcto se obtiene así:

> Consumo de Cedes = diferencia de lecturas de Cedes − consumo de Caffenio − consumo de San Huevito − consumo de Estacionamiento E2

Es decir, al crecimiento de la lectura de Cedes se le descuentan los tres consumos internos.

---

## 4. Fechas de implementación de las fórmulas en el sistema

### Auditorio Luis Elizondo

| Fecha | Qué ocurrió |
|---|---|
| 16 de octubre de 2026 | Se incorporó la fórmula de Auditorio − CDB2 en las pantallas de captura y de edición. |
| 16 de octubre de 2026 | La fórmula quedó documentada en la guía de fórmulas del sistema. |

La fórmula no se aplicó antes de esa fecha. Por eso las semanas anteriores quedaron calculadas únicamente con la diferencia de lecturas de Auditorio.

### Cedes Cisterna

| Fecha | Qué ocurrió |
|---|---|
| 14 de septiembre de 2026 | Se agregó la fórmula de Cedes en las pantallas de captura semanal y mensual. |
| 16 de octubre de 2026 | Se agregó la misma fórmula en las pantallas de edición semanal y mensual. |
| 16 de octubre de 2026 | La fórmula quedó documentada en la guía de fórmulas del sistema. |

Es importante aclarar que la fórmula matemática de Cedes **no cambió después de su creación**. Lo que cambió fue el lugar donde se aplicaba: primero en captura y, un mes después, en edición.

Además, desde el 3 de junio de 2026 el sistema ya contaba con un mecanismo general para restar consumos internos de otros puntos, pero ese mecanismo todavía no incluía ni a Auditorio ni a Cedes.

---

## 5. Diagnóstico de Auditorio Luis Elizondo

### Qué muestran los datos

- Las lecturas del Excel y las del sistema son las mismas en las 42 semanas.
- El Excel aplica la fórmula completa durante todo el año.
- El sistema solo la aplicó en la semana 42.
- En las semanas 1 a 41, el sistema muestra un consumo mayor porque no descontó CDB2.

### Tamaño de la diferencia

La diferencia de cada semana es prácticamente el consumo de CDB2 de esa semana, que va de 2 a 33 metros cúbicos.

| Concepto | Sistema | Excel |
|---|---:|---:|
| Consumo acumulado del año | 3.602,34 m³ | 3.161,00 m³ |
| Diferencia total |  | **441,34 m³** |

De esa diferencia:

- **441 metros cúbicos** corresponden a la resta de CDB2 que el sistema no aplicó en las semanas 1 a 41.
- **0,34 metros cúbicos** corresponden a que el Excel muestra los consumos en números enteros.

### Conclusión

Para Auditorio, el Excel es la referencia correcta. El sistema necesita recalcular las semanas 1 a 41 para descontar CDB2.

---

## 6. Diagnóstico de Cedes Cisterna

### Qué muestran los datos

Las lecturas del Excel y las del sistema coinciden en las 42 semanas.

El comportamiento del consumo es distinto según el periodo:

| Semanas | Sistema | Excel | Explicación |
|---|---|---|---|
| 1 a 35 | Diferencia de lecturas, sin restar | Diferencia de lecturas, sin restar | Ambos coinciden, pero ninguno aplica la fórmula completa |
| 36 y 37 | Fórmula completa | Fórmula completa | Coinciden; la diferencia es solo por el redondeo del Excel |
| 38 a 41 | Diferencia de lecturas, sin restar | Fórmula completa | **Aquí está la discrepancia principal** |
| 42 | Fórmula completa | Fórmula completa | Coinciden; solo hay diferencia por redondeo |

### Diferencias de las semanas 38 a 41

| Semana | Sistema | Excel | Diferencia |
|---|---:|---:|---:|
| 38 | 74 | 53 | +21 m³ |
| 39 | 210 | 145 | +65 m³ |
| 40 | 117 | 98 | +19 m³ |
| 41 | 90 | 76 | +14 m³ |

La diferencia total de esas cuatro semanas es de **119,77 metros cúbicos**, que es justamente lo que suman Caffenio, San Huevito y Estacionamiento E2 en ese periodo.

### Totales del año

| Concepto | Sistema | Excel |
|---|---:|---:|
| Consumo acumulado del año | 4.175,50 m³ | 4.057,00 m³ |
| Diferencia total |  | **118,50 m³** |

La diferencia total se explica así:

- **+119,77 m³** por las restas que el sistema no aplicó en las semanas 38 a 41.
- **−1,27 m³** por el efecto de que el Excel muestra los consumos en números enteros.
- **Resultado: +118,50 m³.**

### Por qué ocurrió

La fórmula de Cedes ya existía en las pantallas de captura desde el 14 de septiembre de 2026. Sin embargo, las pantallas de edición no la tenían hasta el 16 de octubre de 2026.

Eso significa que, si una semana se editó o se recalculó entre esas dos fechas, el sistema volvió a calcular el consumo sin descontar Caffenio, San Huevito ni Estacionamiento E2. El resultado quedó guardado como si la fórmula no existiera.

También puede ocurrir que, si en el archivo semanal no venía la lectura de alguno de esos tres medidores, el sistema haya omitido la resta sin mostrar ningún aviso.

### Conclusión

Para Cedes, el Excel es la referencia correcta a partir de la semana 36. El sistema necesita recalcular al menos las semanas 38 a 41.

Si la fórmula debe aplicarse durante todo el año, entonces también faltan las restas de las semanas 1 a 35 en ambas fuentes.

---

## 7. Caso especial que debe corregirse antes de recalcular

En la semana 11, el medidor de Estacionamiento E2 no tenía lecturas desde la semana 4. En la semana 11 apareció con un valor de 514.

El sistema interpretó que todo ese valor era consumo de una sola semana, porque tomó la lectura anterior como cero. Si se aplicara la fórmula completa en esa semana, el resultado sería **−459 metros cúbicos**, un valor sin sentido.

Por eso, antes de recalcular Cedes en la semana 11, primero debe corregirse ese hueco de medición. No es un error de la fórmula, sino un dato que quedó incompleto y que produce un valor artificial.

---

## 8. Cómo afectan las fechas al recálculo y a la edición

Cuando una semana se edita, el sistema vuelve a calcular el consumo de esa semana con las reglas que tiene disponibles en ese momento.

Esto tuvo tres consecuencias:

1. **Antes del 14 de septiembre de 2026:** ni Auditorio ni Cedes tenían su fórmula. Todo se guardó como diferencia simple de lecturas.
2. **Entre el 14 de septiembre y el 16 de octubre de 2026:** Cedes ya tenía fórmula en captura, pero no en edición. Si una semana se editó en ese periodo, el recálculo no descontó Caffenio, San Huevito ni E2. Auditorio seguía sin fórmula en todas las pantallas.
3. **A partir del 16 de octubre de 2026:** ambas fórmulas quedaron disponibles en captura y edición. Las semanas editadas después de esa fecha sí se recalculan correctamente.

Un punto importante: **corregir o editar una semana posterior no corrige automáticamente las semanas anteriores**. El sistema no recalcula hacia atrás por sí solo. Cada semana debe revisarse y recalcularse de forma expresa.

---

## 9. Conclusión general

La discrepancia entre el sistema y el archivo **"42_Rerportes Operativos"** no es un error de cálculo del Excel. Es el resultado de que las fórmulas se incorporaron al sistema en momentos distintos y de que los recálculos no se aplicaron de forma retroactiva.

- **Auditorio Luis Elizondo:** el Excel está correcto en todo el año. El sistema quedó incompleto de la semana 1 a la 41 porque la fórmula se incorporó hasta el 16 de octubre de 2026.
- **Cedes Cisterna:** el Excel está correcto desde la semana 36. El sistema quedó incompleto en las semanas 38 a 41 porque la fórmula llegó a las pantallas de edición hasta el 16 de octubre de 2026. Las semanas 1 a 35 no tienen la fórmula en ninguna de las dos fuentes.
- **Semana 11 de Cedes:** existe un dato incompleto en Estacionamiento E2 que debe corregirse antes de aplicar la fórmula.

---

## 10. Recomendaciones

1. Usar el archivo **"42_Rerportes Operativos"** como referencia para revisar el año 2026.
2. Recalcular en el sistema las semanas 1 a 41 de Auditorio Luis Elizondo.
3. Recalcular en el sistema las semanas 38 a 41 de Cedes Cisterna.
4. Si la fórmula de Cedes debe aplicarse durante todo el año, revisar también las semanas 1 a 35 en ambas fuentes.
5. Corregir el hueco de lectura de Estacionamiento E2 en la semana 11 antes de recalcular Cedes.
6. Verificar que cada archivo semanal incluya las lecturas de CDB2, Caffenio, San Huevito y Estacionamiento E2. Si falta alguna, el sistema no aplica la resta correspondiente.
7. Definir una fecha única de vigencia de las fórmulas y aplicarla de forma uniforme para evitar que unas semanas queden con fórmula y otras sin ella.
