# Cómo se calcula el consumo de Agua y Gas

Documento explicativo de las formulas para el calculo de consumo de medición de gas y agua.

## Formula Base

El consumo de un medidor se calcula comparando la lectura de hoy con la lectura del periodo anterior:

> **Consumo = (lectura actual − lectura del periodo anterior) × factor**

- El **factor** es un número que "corrige" la lectura del medidor, porque cada medidor mide de manera distinta.
- Cuando no hay factor asignado, se usa **1** (la lectura se usa tal cual).

Algunos puntos, además, **restan el consumo de otros puntos**: son medidores "maestros" que pasan por varios edificios o equipos. Para saber cuánto consumen ellos solos, se les descuenta lo que consumen los puntos más pequeños que dependen de ellos.

> **Consumo final = consumo del punto − consumo de los puntos que dependen de él**

> Nota: los puntos marcados como **"No operativo"** o **"No tomar lectura"** no se miden y **no generan consumo**.

---

# AGUA

## 1. Factores de agua

La gran mayoría de los medidores de agua usan factor **1**. Solo 5 puntos tienen factor especial:

| Punto de medición | Factor |
|---|---|
| Medidor General de los pozos 7, 12, 11 y 14 | 10 |
| Circuito 8" Campus | 10 |
| Circuito 6" Residencias | 10 |
| Línea respaldo (Ciudad) Cisterna 1 y 2 | 10 |
| Cisterna Cedés | 1 |

## 2. Puntos de agua con fórmula simple × 10

Exactamente igual que la fórmula simple, pero multiplicando por 10:

> Consumo = (lectura actual − lectura anterior) × 10

| Punto de medición |
|---|
| Medidor General de los pozos 7, 12, 11 y 14 |
| Circuito 8" Campus |
| Circuito 6" Residencias |
| Línea respaldo (Ciudad) Cisterna 1 y 2 |

## 3. Puntos de agua con fórmula simple (factor 1)

Estos puntos calculan el consumo solo con la diferencia de lecturas:

> Consumo = lectura actual − lectura anterior

**Pozos de Servicios**
- Pozo 11, Pozo 14, Pozo 12, Pozo 7, Pozo 3

**Pozos de Riego**
- Pozo de riego 4, Pozo de riego 8, Pozo de riego 15

**Circuito 8" Campus**
- Auditorio Luis Elizondo, CDB2, CDB2 Baños, Arena Borrego, Lago Aulas 7, Farmville, Em Box, Edificio de Negocios, Aulas 6, Domo Cultural, Wellness Edificio Wellnes + PC, Wellness túnel A6, Parque Central General, Wellness edificio, Wellness Super Salads, Wellness Torre de Enfriamiento, Wellness Alberca, Centrales Comedor (Concesiones), Centrales Doña Tota, Centrales Subway, Centrales Carls Jr., Centrales Pizza Little Caesars, Centrales Grill Team, Centrales Chilaquiles, Centrales Tec Food, Centrales Oxxo, Centrales túnel (llave cto. basura), Centrales Norte, Biotecnología (Laboratorios), Escuela de Arte, CIAP Oriente, CIAP Centro, CIAP Poniente, CIAP Green Shake, CIAP Tim Hortons, CIAP DC Jochos, CIAP Crepaso, CIAP El Negro, Biotecnología (Baños), CIAP Starbucks, CIAP Super Salads, CIAP Sótano, Espacio de Reflexión, Residencias 10 y 15, Caffenio, Residencias 10 y 15 (Torres de enfriamiento), Cedés Site (Tinaco), Cedés Site (Bomba), Expedition, Expedition Bread, Expedition Matthew, HUB, Estacionamiento E2 (General), E2 Beiker, E2 Evobike, E2 Pancho de Rigo, E2 Bebedero, Aulas 1, Rectoría, Pabellón La Carreta, Aulas 2, Cetec, Biblioteca, Biblioteca Nikkori, Biblioteca Nectar Works, Biblioteca Tim Hortons, Centrales Sur, Aulas 4 Norte, Aulas 4 Centro

**Circuito 6" Residencias**
- Residencias 2, Residencias 2 pte, Residencias 3, Residencias 5, R2 Happy Salads, Residencias 1, Residencias 1 Lavandería, E3 Mil Caras

**Circuito 4" A7-CE**
- Circuito 4" A7-CE, Aulas 7, CAH 3 Torre de Enfriamiento, Aulas 7 Caldera 3, DIA, Centro de Congresos, Comedor Jubileo, Aulas 4 OXXO

**Circuito Planta Física**
- Circuito Planta Física, Estacionamiento E1, Megacentral Torres de Enfriamiento 2, Escamilla baños (Cancha sintética), Estadio Borregos Torre de Enfriamiento, Campus Norte Edificio D (Ciudad), Estadio Azul

**Circuito Megacentral**
- Circuito Megacentral, Megacentral Torre de Enfriamiento 4

**Riego / PTAR**
- Pozo 4 (Riego), Pozo 8 (Riego), Pozo 15 (Riego), Campus Norte (respaldo), Campus Norte Comedor D

**Purgas y Evaporación**
- Wellness Cisterna Pluvial purgas, Wellness Suavizador (purga), Wellness (purga T.E.), Wellness (rebosadero T.E.), Megacentral (purga T.E.), Megacentral Suavizador Purga, CAH3 (purga T.E.), Residencias 10 y 15 (purga T.E.), CIAP Cisterna Pluvial

**Agua de la Ciudad**
- Estacionamiento E3 (Ciudad), Guardería (Ciudad), Naranjos (Ciudad-Guardería), Casa Solar (Ciudad), Residencias 11 (Ciudad), Residencias 12 (Ciudad), Residencias 13 (Ciudad), Residencias 13-2 (Ciudad), Residencias 13-3 (Ciudad), Residencias 15 sótano

## 4. Puntos de agua que restan consumo de otros puntos

Se calculan primero con la fórmula simple y **después** se les descuenta el consumo de los puntos que dependen de ellos:

| Punto | Le descuenta el consumo de |
|---|---|
| Estadio Borregos | Estadio Azul |
| Estadio Borregos (purgas) | Wellness (purga T.E.) |
| Aulas 4 Sur | CDI-Caseta Oficinas |
| Aulas 4 maestros | CDI-Baños construcción |
| Núcleo | Expedition y HUB |
| Aulas 3 | Aulas 3 Basanti y Aulas 3 Sr. Latino |
| Cedés (cisterna) | Caffenio, Cedés San Huevito y Estacionamiento E2 (General) |

---

# GAS

## 1. Factores de gas

Cada medidor de gas tiene su propio número corrector. Si un punto no viene en la lista, usa factor **1**.

| Punto de medición | Factor |
|---|---|
| Campus Acometida Ppal digital | 1 |
| Campus Acometida Ppal analógica | 2.44 |
| Domo Cultural | 2.34 |
| Centrales General concesiones | 2.34 |
| Centrales Doña Tota | 2.34 |
| Centrales Chilaquiles Tec | 1 |
| Centrales Carls Junior | 2.34 |
| Centrales Tec Food | 2.34 |
| Centrales Grill Team | 1 |
| Centrales Pizza Little Caesars | 1 |
| Biotecnología (Laboratorios) | 2.34 |
| Mega Calefacción 1 | 2.34 |
| Mega Calefacción 2 | 2.34 |
| Mega Calefacción 3 | 2.34 |
| Mega Calefacción 4 | 2.34 |
| Mega Calefacción 5 | 2.34 |
| CIAP Super Salads | 2.34 |
| Aulas 1 | 2.34 |
| Biblioteca | 2.34 |
| Biblioteca Nikkori | 9.86 |
| Biblioteca Nectar Works | 9.86 |
| Sr. Latino | 2.34 |
| Arena Borrego | 2.34 |
| Aulas 7 Sótano Calefacción 1 (Bryan) | 2.34 |
| Aulas 7 Sótano Calefacción 2 (Aerco) | 2.34 |
| Aulas 7 Sótano Calefacción 3 | 2.34 |
| Aulas 7 (Laboratorios) | 2.34 |
| DIA | 2.34 |
| Aulas 4 (Laboratorios) | 2.34 |
| Centro de Congresos Vestidores | 1.01 |
| Jubileo (Cocina) | 0.94 |
| Expedition | 2.34 |
| Expedition Bread | 2.34 |
| Expedition Matthew | 2.34 |
| Polígono residencias 1, 2, 3, 4 y 5 (Digital) | 1 |
| Polígono residencias 1, 2, 3, 4 y 5 (Analógico) | 1.54 |
| Cedés (Laboratorios) | 0.98 |
| Residencias 2 | 0.98 |
| Residencias 5 | 0.98 |
| Residencias 3 | 1.52 |
| Residencias 1 Calefacción | 1.52 |
| Residencias 1 Regaderas | 1.52 |
| Residencias 1 Locales de comida | 1 |
| Campus Norte Acometida externa | 1.14 |
| Campus Norte Acometida interna | 1.14 |
| Campus Norte Edificio D Calefacción | 0.97 |
| Campus Norte Comedor D | 0.97 |
| Estadio Borrego Acometida digital | 1 |
| Estadio Borrego Acometida analógica | 1.16 |
| Estadio Yarda | 1 |
| Wellness Acometida digital | 1 |
| Wellness Acometida analógica | 1.2 |
| Wellness Super Salads | 1.2 |
| Wellness Calentador Sótano (Regaderas) | 1 |
| Wellness Alberca | 1 |
| Auditorio Luis Elizondo | 1 |
| Pabellón Tec Cocina Estudiantes 2° piso | 1.48 |
| Guardería | 1 |
| Escamilla (CDB1) | 1 |
| Casa Solar | 1 |
| Estudiantes 11 | 1 |
| Estudiantes 12 | 1 |
| Estudiantes 13 | 1 |
| Estudiantes 15 y 10 | 1 |

## 2. Puntos de gas con fórmula simple

Todos los puntos de la tabla anterior usan la fórmula simple:

> Consumo = (lectura actual − lectura anterior) × factor

El factor es el que corresponde a cada medidor según la tabla anterior.

## 3. Puntos de gas que restan consumo de otros puntos

Solo hay un caso en gas:

| Punto | Le descuenta el consumo de |
|---|---|
| Wellness General (Calefacción) | Wellness Super Salads |

Es decir, al consumo de "Wellness General (Calefacción)" (calculado con su fórmula simple × 1) **se le resta** el consumo de "Wellness Super Salads", porque el medidor general alimenta ese negocio.

---

# Resumen rápido

| Tipo de punto | Cómo se calcula |
|---|---|
| Fórmula simple | Lectura actual menos lectura anterior, multiplicado por su factor |
| Fórmula con resta | Fórmula simple primero y después se le quita el consumo de los puntos que dependen de él |

- **Agua**: casi todos usan fórmula simple (factor 1); 4 medidores multiplican por 10 y 7 puntos restan el consumo de otros.
- **Gas**: todos usan fórmula simple con su factor propio (va de 0.94 a 9.86); solo 1 punto resta el consumo de otro (Wellness General Calefacción).