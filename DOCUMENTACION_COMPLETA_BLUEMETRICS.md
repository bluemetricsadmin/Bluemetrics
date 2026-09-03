# Documentación Completa de Bluemetrics

> **Versión:** 2.0  
> **Última actualización:** Septiembre 2026  
> **Stack:** React 19 + Supabase + Vite 7 + TailwindCSS 4  
> **Propósito:** Plataforma de monitoreo de consumo de agua, gas y PTAR para campus universitario

---

## Índice

1. [Navegación de Pantallas](#1-navegación-de-pantallas)
2. [Arquitectura del Proyecto](#2-arquitectura-del-proyecto)
3. [Migraciones de Datos](#3-migraciones-de-datos)
4. [Roles de Usuario](#4-roles-de-usuario)
5. [Stack Tecnológico Actual](#5-stack-tecnológico-actual)
6. [Normalización de la Base de Datos](#6-normalización-de-la-base-de-datos)
7. [Alertas en Tiempo Real](#7-alertas-en-tiempo-real)
8. [Flujo de Datos Frontend-Backend](#8-flujo-de-datos-frontend-backend)

---

## 1. Navegación de Pantallas

### 1.1 Mapa General de Navegación

```
                              +-----------------+
                              |   LandingPage   |
                              |       (/)       |
                              +--------+--------+
                                       |
                        +--------------+--------------+
                        |              |              |
                   click login    click CTA     footer links
                        |              |              |
                        v              v              v
                  +-----------+  +-----------+  +------------+
                  | LoginPage |  |ContactPage|  |NosotrosPage|
                  |  /login   |  | /contacto |  | /nosotros  |
                  +-----+-----+  +-----------+  +------------+
                        |
              (successful login)
                        |
            +-----------+-----------+
            |                       |
      role=datos              other roles
            |                       |
            v                       v
    /agregar-lecturas         /dashboard
                                   |
                       (DASHBOARD - sidebar)
                            /dashboard
                                |
            +-------------------+-------------------+-------------------+-------------------+
            |                   |                   |                   |                   |
       Gestión              Gestión           Administración        Importación          Análisis
       Hídrica              de Gas            de Datos              Excel/SQL
            |                   |                   |                   |
     +------+------+     +-----+------+     +------+-------+     +---+---+
     |      |      |     |     |       |     |      |       |     |       |
   /pozos /consumo /consumo-   /consumo-gas  /agregar-*   /excel-to-sql
   /pozos/:id      mensual-agua  /consumo-    /editar-*   /excel-to-sql/agua/2023
   /lecturas-diarias              mensual-gas             /excel-to-sql/gas/2023
                                                          /excel-to-sql/ptar
                                                          /csv-to-sql-daily

     Sección Análisis (cualquier usuario autenticado):
     /alertas  /predicciones  /analisis
     (Desde v2.0, en el sidebar solo /alertas está visible;
      /predicciones y /analisis siguen siendo accesibles por URL)

     Admin:
     /correos

     Catch-all:
     * -> /error-page (404)
```

### 1.2 Tabla Completa de Rutas

#### Rutas Públicas (sin guardián)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `LandingPage` | Página de aterrizaje con hero, calculadora ROI, sección de tecnología |
| `/login` | `LoginPageNew` | Autenticación con email/contraseña |
| `/contacto` | `ContactPage` | Formulario de contacto vía Brevo |
| `/nosotros` | `NosotrosPage` | Página "Sobre nosotros" |
| `/confirmacion` | `ConfirmationPage` | Confirmación post-contacto |

#### Dashboard

| Ruta | Guardián | Componente | Permiso Requerido |
|------|----------|-----------|-------------------|
| `/dashboard` | `PermissionRoute` | `DashboardPage` | `dashboard` |

#### Gestión Hídrica

| Ruta | Guardián | Componente | Permiso Requerido |
|------|----------|-----------|-------------------|
| `/consumo` | `PermissionRoute` | `ConsumptionPage` | `water` |
| `/pozos` | `PermissionRoute` | `WellsPage` | `water` |
| `/pozos/:id` | `PermissionRoute` | `WellDetailPage` | `water` |
| `/lecturas-diarias` | `PermissionRoute` | `DailyReadingsPage` | `water` |
| `/consumo-mensual-agua` | `PermissionRoute` | `MonthlyWaterConsumptionPage` | `water` |
| `/balance` | `PermissionRoute` | `WaterBalancePage` | `dashboard` |

#### Gestión de Gas

| Ruta | Guardián | Componente | Permiso Requerido |
|------|----------|-----------|-------------------|
| `/consumo-gas` | `PermissionRoute` | `GasConsumptionPage` | `gas` |
| `/consumo-mensual-gas` | `PermissionRoute` | `GasComsuptionMonthlyPage` | `gas` |

#### PTAR

| Ruta | Guardián | Componente | Permiso Requerido |
|------|----------|-----------|-------------------|
| `/ptar` | `PermissionRoute` | `PTARPage` | `ptar` |

#### Análisis (cualquier usuario autenticado)

| Ruta | Guardián | Componente |
|------|----------|-----------|
| `/alertas` | `ProtectedRoute` | `AlertsPage` |
| `/predicciones` | `ProtectedRoute` | `PredictionsPage` |
| `/analisis` | `ProtectedRoute` | `AnalysisSectionPage` |

#### Rutas de Datos (DataRoute: admin, datos, water)

| Ruta | Componente |
|------|-----------|
| `/agregar-datos` | `AddDataPage` |
| `/agregar-lecturas` | `AddWeeklyReadingsPage` |
| `/editar-lecturas` | `EditWeeklyReadingsPage` |
| `/agregar-lecturas-diarias` | `AddDailyReadingsPage` |
| `/editar-lecturas-diarias` | `EditDailyReadingsPage` |
| `/agregar-lecturas-gas` | `AddWeeklyGasReadingsPage` |
| `/editar-lecturas-gas` | `EditGasReadingsPage` |
| `/agregar-lecturas-ptar` | `AddPTARReadingsPage` |
| `/editar-lecturas-ptar` | `EditPTARReadingsPage` |
| `/agregar-lecturas-mensuales-agua` | `AddMonthlyWaterReadingsPage` |
| `/editar-lecturas-mensuales-agua` | `EditMonthlyWaterReadingsPage` |
| `/agregar-lecturas-mensuales-gas` | `AddMonthlyGasReadingsPage` |
| `/editar-lecturas-mensuales-gas` | `EditMonthlyGasReadingsPage` |

#### Importación Excel/SQL (DataRoute)

| Ruta | Componente |
|------|-----------|
| `/excel-to-sql` | `ExcelToSqlPage` (hub central) |
| `/excel-to-sql/agua/2023` | `ExcelToSqlAgua2023` |
| `/excel-to-sql/agua/2024` | `ExcelToSqlAgua2024` |
| `/excel-to-sql/agua/2025` | `ExcelToSqlAgua2025` |
| `/excel-to-sql/gas/2023` | `ExcelToSqlGas2023` |
| `/excel-to-sql/gas/2024` | `ExcelToSqlGas2024` |
| `/excel-to-sql/gas/2025` | `ExcelToSqlGas2025` |
| `/excel-to-sql/gas/2025/comedor-tec-food` | `GasComedorTecFoodPage` |
| `/excel-to-sql/ptar` | `ExcelToSqlPTAR` |
| `/excel-to-sql/agua-mensual` | `ExcelToSqlMonthlyWater` |
| `/csv-to-sql-daily` | `CsvToSqlDailyPage` |

#### Admin

| Ruta | Guardián | Componente |
|------|----------|-----------|
| `/correos` | `AdminRoute` | `CorreosPage` |

#### 404

| Ruta | Componente |
|------|-----------|
| `*` | `ErrorPage` |

### 1.3 Jerarquía de Guardianes de Ruta

```
Public (sin guardián)
  |
  +-- ProtectedRoute (solo verifica autenticación)
  |     |-- /alertas, /predicciones, /analisis
  |
  +-- PermissionRoute (verifica auth + permiso específico)
  |     |-- permission="dashboard": /dashboard, /balance
  |     |-- permission="water": /consumo, /pozos, /pozos/:id, /lecturas-diarias, /consumo-mensual-agua
  |     |-- permission="gas": /consumo-gas, /consumo-mensual-gas
  |     |-- permission="ptar": /ptar
  |
  +-- DataRoute (verifica rol admin|datos|water)
  |     |-- Todas las rutas /agregar-*, /editar-*, /excel-to-sql/*
  |
  +-- AdminRoute (verifica isAdmin)
        |-- /correos
```

#### Comportamiento de cada guardián

| Guardián | Archivo | No autenticado | No autorizado | Estado carga |
|----------|---------|---------------|---------------|-------------|
| `ProtectedRoute` | `ProtectedRouteNew.jsx` | Redirige a `/login` | N/A (siempre renderiza) | Spinner centrado |
| `PermissionRoute` | `PermissionRoute.jsx` | Redirige a `/login` | Muestra "Acceso Restringido" | Spinner centrado |
| `DataRoute` | `DataRouteNew.jsx` | Redirige a `/login` | Redirige a `/dashboard` | "Verificando permisos..." |
| `AdminRoute` | `AdminRouteNew.jsx` | Redirige a `/login` | Muestra "Acceso Denegado" | Spinner centrado |

### 1.4 Estructura del Sidebar

El sidebar (`dashboard-sidebar.jsx`) es un panel lateral fijo (`w-64`) con **6 secciones** colapsables cuyo estado se persiste en `localStorage` bajo la clave `sidebar-expanded-sections`.

| Sección | Roles Permitidos | Items |
|---------|-----------------|-------|
| **General** | admin, datos, ejecutivo, gas, ptar, user | Dashboard Principal |
| **Administración de Datos** | admin, datos | 12 items (lecturas semanales/mensuales/diarias/PTAR agua y gas + ediciones) |
| **Importación Excel/SQL** | admin, datos | 8 items (agua 2023-2025, gas 2023-2025, agua mensual) |
| **Gestión Hídrica** | admin, ejecutivo, water, user | Pozos, Consumo Semanal Agua, Consumo Mensual Agua, Lecturas Diarias |
| **Gestión de Gas** | admin, ejecutivo, **water**, gas, user | Consumo Semanal de Gas, Consumo Mensual de Gas |
| **Análisis** | admin, ejecutivo, gas, ptar, user, **water** | **Solo Alertas** (Centro de Análisis y Predicciones están comentados) |

> **Nota (v2.0):** El rol `water` fue **añadido** a las secciones "Gestión de Gas" y "Análisis" del sidebar. Los ítems "Centro de Análisis" y "Predicciones" del menú Análisis están **comentados** en el código, dejando únicamente "Alertas" visible. El ítem "Consumo Mensual de Gas" está limitado a roles `admin`, `ejecutivo`, `water` y `gas` (sin `user`).

> **Nota (v2.0):** Aunque `PTARPage` existe y está enrutada en `App.jsx`, el ítem "PTAR" y "Balance Hídrico" están **comentados** en el sidebar; el acceso a `/ptar` solo es posible vía URL directa.

#### Mecanismo de filtrado del sidebar

```javascript
const menuSections = allMenuSections
  .filter(section => section.allowedRoles.includes(currentRole))
  .map(section => ({
    ...section,
    items: section.items.filter(item => item.allowedRoles.includes(currentRole))
  }))
  .filter(section => section.items.length > 0)
```

### 1.5 Flujo de Autenticación

1. El usuario ingresa a `/login`
2. `LoginPageNew` llama a `supabase.auth.signInWithPassword({ email, password })`
3. `AuthContextNew` detecta el cambio de estado vía `supabase.auth.onAuthStateChange()`
4. Busca el perfil en `public.profiles` usando el `id` del usuario auth
5. Construye el objeto `user` con: `{ id, email, role, name, username, company }`
6. Según el rol, redirige a:
   - `datos` → `/agregar-lecturas`
   - Tiene permiso `dashboard` → `/dashboard`
   - Tiene permiso `water` → `/consumo`
   - Tiene permiso `gas` → `/consumo-gas`
   - Tiene permiso `ptar` → `/ptar`
   - Fallback → `/`

Además, el componente `RedirectIfNotAuth` se usa dentro de páginas individuales como capa extra de seguridad, restringiendo al rol `datos` a solo rutas de captura de datos.

---

## 2. Arquitectura del Proyecto

### 2.1 Estructura de Directorios

```
Bluemetrics/
├── index.html                          # Entrada SPA
├── package.json                        # aquanet-mockup v0.0.0
├── vite.config.js                      # Vite + React SWC + TailwindCSS
├── eslint.config.js                    # ESLint flat config
├── netlify.toml                        # Redirecciones SPA Netlify
├── vercel.json                         # Redirecciones SPA Vercel
├── .env                                # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_SCRIPT_URL
│
├── public/                             # Assets estáticos (SVGs, imágenes)
│
├── src/
│   ├── main.jsx                        # Punto de entrada (BrowserRouter + App)
│   ├── App.jsx                         # Router con 40+ rutas
│   ├── index.css                       # Tailwind + tema azul marino
│   ├── supabaseClient.js               # Cliente singleton de Supabase
│   │
│   ├── assets/                         # Imágenes, SVGs, video (waterPlant.mp4)
│   │
│   ├── components/                     # Componentes reutilizables
│   │   ├── dashboard-sidebar.jsx       # Sidebar de navegación
│   │   ├── dashboard-header.jsx        # Header del dashboard
│   │   ├── dashboard-summary.jsx       # Tarjetas resumen dashboard
│   │   ├── Route guards (6 archivos)   # Protección de rutas
│   │   ├── Charts                       # Gráficas comparativas (Chart.js, Recharts)
│   │   │   ├── WeeklyComparisonChart.jsx      # Comparación semanal multiaño
│   │   │   ├── WeeklyComparisonTable.jsx      # Tabla comparativa semanal
│   │   │   ├── MonthlyComparisonChart.jsx     # Comparación mensual multiaño
│   │   │   ├── AdvancedConsumptionChart.jsx   # Consumo avanzado
│   │   │   ├── DailyConsumptionChartJS.jsx    # Consumo diario (Chart.js)
│   │   │   ├── PTARComparisonChart.jsx        # Comparación PTAR
│   │   │   ├── WellsGeneralCharts.jsx         # Gráficas generales pozos
│   │   │   ├── ChartComponent.jsx / DashboardChart.jsx
│   │   │   └── main-consumption-metrics.jsx
│   │   ├── WellComments.jsx            # Sistema de comentarios
│   │   ├── WellEventsHistory.jsx       # Historial de eventos
│   │   ├── alerts-recommendations-system.jsx  # Sistema de alertas (UI)
│   │   ├── ExcelToSqlConverter.jsx     # Convertidor Excel a SQL
│   │   ├── ConsumptionTable.jsx        # Tabla de consumo reutilizable (agua/gas)
│   │   ├── MetricCard.jsx              # Tarjeta de métrica
│   │   ├── water-balance-flow.jsx      # Balance hídrico
│   │   ├── BrevoForm.jsx               # Formulario de contacto (Brevo)
│   │   ├── PointsOrderModal.jsx        # Modal orden de puntos
│   │   ├── predictive-analytics-panel.jsx  # Panel de predicción
│   │   ├── analysis/                   # Componentes de análisis
│   │   │   ├── ChartCard.jsx
│   │   │   ├── ChartModal.jsx
│   │   │   └── FilterPanel.jsx
│   │   ├── ui/                         # Primitivas UI (shadcn-like)
│   │   │   ├── badge.jsx
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   └── dialog.jsx
│   │   └── svg/                        # Componentes SVG (logos)
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx             # Contexto auth (versión anterior)
│   │   └── AuthContextNew.jsx          # Contexto auth (versión activa)
│   │
│   ├── hooks/
│   │   ├── usePermissions.js          # Hook de permisos por rol
│   │   ├── usePersistedState.js       # Estado persistido en localStorage
│   │   ├── usePredictions.js          # Hook de predicciones (API ML)
│   │   └── useUserRole.js             # Obtener rol desde profiles
│   │
│   ├── services/                       # ⬅ NUEVO en v2.0
│   │   └── predictionService.js        # Cliente HTTP de la API de ML
│   │
│   ├── config/
│   │   ├── excelToSqlConfigs.js       # 15+ configuraciones Excel-to-SQL
│   │   └── permissions.js             # Matriz de roles x permisos
│   │
│   ├── lib/                           # Datos estáticos/locales
│   │   ├── consumption-points.json    # 100+ puntos de consumo de agua
│   │   ├── gas-consumption-points.json # Puntos de consumo de gas
│   │   ├── dashboard-data.js          # Datos mock/estáticos del dashboard
│   │   ├── datos_pozo_*.json          # Datos históricos de pozos
│   │   ├── pozoLabels.js              # Etiquetas de pozos para predicción
│   │   ├── predictionMapping.js       # Mapeo Supabase→API de predicción
│   │   ├── charts-registry.js         # Registro de gráficas
│   │   └── utils.js                   # Utilidades
│   │
│   ├── pages/                         # Páginas de la aplicación
│   │   ├── DashboardPage.jsx
│   │   ├── ConsumptionPage.jsx
│   │   ├── WellsPage.jsx
│   │   ├── WellDetailPage.jsx
│   │   ├── PTARPage.jsx
│   │   ├── GasConsumptionPage.jsx
│   │   ├── GasComsuptionMontlyPage.jsx
│   │   ├── WaterBalancePage.jsx
│   │   ├── MonthlyWaterConsumptionPage.jsx
│   │   ├── DailyReadingsPage.jsx
│   │   ├── AlertsPage.jsx
│   │   ├── PredictionsPage.jsx
│   │   ├── AnalysisSectionPage.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPageNew.jsx            # + LoginPage heredado
│   │   ├── ContactPage.jsx
│   │   ├── NosotrosPage.jsx
│   │   ├── ConfirmationPage.jsx
│   │   ├── CorreosPage.jsx
│   │   ├── AddWeeklyReadingsPage.jsx   # + edición
│   │   ├── AddDailyReadingsPage.jsx    # + edición
│   │   ├── AddPTARReadingsPage.jsx     # + edición
│   │   ├── AddWeeklyGasReadingsPage.jsx # + edición
│   │   ├── AddMonthlyWaterReadingsPage.jsx # + edición
│   │   ├── AddMonthlyGasReadingsPage.jsx # + edición
│   │   ├── ExcelToSqlPage.jsx
│   │   ├── CsvToSqlDailyPage.jsx
│   │   ├── ErrorPage.jsx
│   │   ├── ExcelToSql/               # Páginas específicas por año
│   │   │   ├── ExcelToSqlAgua2023.jsx
│   │   │   ├── ExcelToSqlAgua2024.jsx
│   │   │   ├── ExcelToSqlAgua2025.jsx
│   │   │   ├── ExcelToSqlGas2023.jsx
│   │   │   ├── ExcelToSqlGas2024.jsx
│   │   │   ├── ExcelToSqlGas2025.jsx
│   │   │   ├── ExcelToSqlMonthlyWater.jsx
│   │   │   └── ExcelToSqlPTAR.jsx
│   │   └── DEPRECATED/               # Componentes deprecados
│   │
│   └── utils/
│       ├── wellAlertEvaluator.js      # Evaluador de anomalías de sobreconsumo
│       ├── wellAlertSync.js           # Sincronización de alertas con Supabase
│       ├── chartColors.js             # Colores fijos por año para gráficas
│       ├── consumptionHelpers.js      # Helpers puros de cálculo de consumo
│       ├── yearOverYear.js            # Utilidades comparativas año a año
│       ├── tableHelpers.js            # Helpers de tablas por año/gas
│       ├── clearAuthCache.js          # Debug: limpiar caché de auth
│       └── testSupabaseConnection.js  # Debug: probar conexión Supabase
│
├── 48 archivos SQL de migración        # Migraciones en la raíz
└── 20+ archivos de documentación .md   # Documentación dispersa
```

### 2.2 Patrón Arquitectónico

El proyecto sigue una **arquitectura SPA (Single Page Application)** con los siguientes patrones:

- **Sin ORM**: Todas las consultas a Supabase son llamadas directas usando `supabase.from('tabla').select/insert/update/upsert`
- **Estado global mínimo**: Solo `AuthContext` para el estado de autenticación. Cada página maneja su propio estado local con `useState`
- **Persistencia local**: `usePersistedState` hook para preservar estado en `localStorage` durante wizards de varios pasos
- **Data fetching directo**: Las páginas hacen fetch directamente en `useEffect` al montar, sin capa de caché (React Query, SWR, etc.)
- **Estados de UI**: Cada página maneja sus propios estados loading/error/empty de forma individual
- **Config-driven**: El sistema Excel-to-SQL se basa completamente en configuraciones (15 configs) que impulsan un solo componente genérico
- **Formato de fecha mexicano**: El sistema aplica `toLocaleString('es-MX')` de forma consistente en todas las métricas (herramientas de formato en `utils/`)
- **Comparación multiaño con colores fijos**: `chartColors.js` asigna un color determinista por año calendario (2023 naranja, 2024 púrpura, 2025 verde, 2026 azul) usado en todas las gráficas comparativas
- **Gráficas comparativas reutilizables**: `WeeklyComparisonChart`, `MonthlyComparisonChart` y `WeeklyComparisonTable` aceptan datos multiaño para visualizar un mismo periodo contra todos los años disponibles

### 2.3 Árbol de Componentes

```
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPageNew />} />
      <Route path="/contacto" element={<ContactPage />} />

      <Route path="/dashboard" element={
        <PermissionRoute permission="dashboard">
          <RedirectIfNotAuth>
            <DashboardHeader />
            <DashboardSidebar />
            <DashboardPageContent />
          </RedirectIfNotAuth>
        </PermissionRoute>
      } />

      <!-- Patrón similar para todas las rutas protegidas -->
      <Route path="/pozos" element={
        <PermissionRoute permission="water">
          <WellsPage /> {/* internamente renderiza Header + Sidebar */}
        </PermissionRoute>
      } />

      <!-- Data entry routes -->
      <Route path="/agregar-lecturas" element={
        <DataRoute>
          <AddWeeklyReadingsPage />
        </DataRoute>
      } />

      <Route path="*" element={<ErrorPage />} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

> **Nota:** No existe un layout centralizado. Cada página protegida importa individualmente `DashboardHeader` y `DashboardSidebar`.

---

## 3. Migraciones de Datos

### 3.1 Inventario Completo (51+ archivos SQL)

Las migraciones están en la raíz del proyecto (no en `supabase/migrations/`). Se organizan en 7 categorías:

#### Categoría 1: Tablas de Agua (Lecturas Semanales)

| Archivo | Tablas Creadas | Descripción |
|---------|---------------|-------------|
| `supabase_lecturas_semana.sql` | `Lecturas_Semana_Agua_2023`, `Lecturas_Semana_Agua_2024`, `Lecturas_Semana_Agua_2025`, `Lecturas_Semana_Agua_2026` | Lecturas semanales de agua con ~170 columnas DECIMAL(10,2) cada una |
| `supabase_consumo_semanal.sql` | `Lecturas_Semana_Agua_consumo_2023`, `Lecturas_Semana_Agua_consumo_2024`, `Lecturas_Semana_Agua_consumo_2025`, `Lecturas_Semana_Agua_consumo_2026` | Consumo semanal de agua (misma estructura que lecturas) |
| `supabase_lecturas_semana_consumo_exact.sql` | Mismas 4 tablas de consumo | Versión alternativa con definiciones exactas |
| `supabase_creacion_tablas_v2.sql` | Tablas de agua v2 | Segunda versión de creación |

#### Categoría 2: Tablas de Gas

| Archivo | Tablas Creadas | Descripción |
|---------|---------------|-------------|
| Varios archivos con nombre `lecturas_semanales_gas_2023.sql` a `lecturas_semanales_gas_2026.sql` | `lecturas_semanales_gas_2023`, `lecturas_semanales_gas_2024`, `lecturas_semanales_gas_2025`, `lecturas_semanales_gas_2026` | Lecturas semanales de gas con ~60 columnas DECIMAL(15,3) |
| `consumo_gas_tablas.sql` | `lecturas_semanales_gas_consumo_2023`, `lecturas_semanales_gas_consumo_2024`, `lecturas_semanales_gas_consumo_2025`, `lecturas_semanales_gas_consumo_2026` | Consumo semanal de gas |
| `supabase_consumo_mensual_gas.sql` | `lecturas_mensuales_gas`, `lecturas_mensuales_gas_consumo` | Consumo mensual de gas |
| `supabase_lecturas_gas_mensual.sql` | `lecturas_mensuales_gas` | Lecturas mensuales de gas |
| `supabase_lecturas_gas_semana2025.sql` | `lecturas_semanales_gas_2025` | Lecturas semanales de gas 2025 |

#### Categoría 3: Tablas de PTAR

| Archivo | Tablas Creadas | Descripción |
|---------|---------------|-------------|
| `supabase_ptar_lecturas.sql` | `lecturas_ptar` | Lecturas diarias PTAR (8 columnas: id, fecha, hora, medidor_entrada, medidor_salida, ar, at, recirculacion, total_dia) |
| `supabase_ptar_vistas.sql` | `vista_ptar_resumen_anual`, `vista_ptar_resumen_mensual`, `vista_ptar_resumen_trimestral` | Vistas de resumen PTAR |
| `supabase_ptar_vistas_actualizadas.sql` | Vistas PTAR actualizadas | Versión mejorada de las vistas |

#### Categoría 4: Tablas Diarias y Mensuales de Agua

| Archivo | Tablas Creadas | Descripción |
|---------|---------------|-------------|
| `supabase_lecturas_diarias.sql` | `lecturas_diarias`, `lecturas_diarias_consumo` | Lecturas diarias de agua |
| `migracion_consumo_lecturas_diarias.sql` | Migración a `lecturas_diarias` | Unificación de datos diarios |
| `migracion_mes_anio_lecturas_diarias.sql` | Columnas `mes_anio` en `lecturas_diarias` | Migración de formato de fecha |
| `supabase_lecturas_mensuales.sql` | `lecturas_mensuales_agua`, `lecturas_mensuales_agua_consumo` | Lecturas mensuales de agua |
| `migrar_mensual_pozos.sql` | Columnas de pozos en tablas mensuales | Migración de datos de pozos |

#### Categoría 5: Autenticación y Perfiles

| Archivo | Tablas Creadas | Descripción |
|---------|---------------|-------------|
| `supabase_usuarios.sql` | `profiles` | Perfiles de usuario (id FK a auth.users, email, username, full_name, company, role, avatar_url) |

#### Categoría 6: Alertas y Fugas

| Archivo | Tablas Creadas | Descripción |
|---------|---------------|-------------|
| `supabase_fuga_alerts_diario.sql` | Alertas de fuga diarias | Sistema de detección de fugas (diario) |
| `supabase_fuga_alerts_semanal.sql` | Alertas de fuga semanales | Sistema de detección de fugas (semanal) |
| `supabase_fuga_alerts_mensual.sql` | Alertas de fuga mensuales | Sistema de detección de fugas (mensual) |
| `supabase_fuga_alerts_views.sql` | `vista_fugas_semanales`, `vista_fugas_mensuales`, `vista_fugas_diarias`, `vista_fugas_activas` | Vistas de alertas de fuga |
| `supabase_fuga_alerts_realtime.sql` | Habilita Realtime en `well_events` | Configuración de Realtime para alertas |
| `supabase_well_events.sql` | `well_events` | Tabla unificada de eventos de pozos (incluye alertas) |
| `migracion_eventos_bienvenida.sql` | `bienvenida` | Eventos de bienvenida |
| `supabase_sobreconsumo.sql` | Alertas de sobreconsumo | Tablas y lógica de sobreconsumo |

#### Categoría 7: Comentarios, Correos y Utilidades

| Archivo | Tablas Creadas | Descripción |
|---------|---------------|-------------|
| `supabase_reading_comments.sql` / `supabase-migration-reading-comments.sql` | `reading_comments` | Comentarios en lecturas (id, year, week_number, point_id, comment, author) |
| `supabase_comentarios_pozos.sql` | `well_comments` | Comentarios en pozos |
| `supabase_correos.sql` / `supabase_correos_table.sql` | `correos` | Bandeja de entrada de formulario de contacto |
| `supabase_factores_agua.sql` | `factores_agua` | Factores de conversión de agua |
| `supabase_weekly_comments.sql` | `weekly_comments` | **NUEVO (v2.0):** Comentarios semanales por recurso (agua/gas), únicos por (week_number, source_type), autor referencia a profiles.id |
| Varios archivos de columnas | Migraciones de columnas | `add_caffenio_migration.sql`, `add_agua_columns_2023_2026.sql`, `migration_fix_gas_unique.sql`, `migracion_ptar_columnas.sql` |

#### Categoría 8: Alertas Unificadas (NUEVO en v2.0)

| Archivo | Descripción |
|---------|-------------|
| `supabase_unifica_alertas_anomalia.sql` (1027 líneas) | Reemplaza los 3 tipos automáticos anteriores (`alerta_consumo`, `sobreconsumo`, `posible_fuga`) por **un único tipo `anomalia_sobreconsumo`**. Evalúa cada lectura con 3 reglas AND simultáneas y deduplica por periodo mediante índices únicos. Limpia los triggers pg_cron antiguos. |
| `add_l_lago_aulas_7_llenado_column.sql` | Añade columna `l_lago_aulas_7_llenado` a tablas de agua |
| `add_l_sedes_site_boma_column.sql` | Añade columna `l_sedes_site_boma` a tablas de agua |

> **Nota v2.0:** El archivo `supabase_unifica_alertas_anomalia.sql` es la migración más relevante del periodo. Unifica todo el sistema de alertas automáticas bajo un solo tipo de evento con la misma lógica de evaluación (3 reglas simultáneas) para lecturas diarias, semanales y mensuales.

### 3.2 Resumen de Tablas Creadas (38 tablas)

| Tabla | Tipo | Filas Aprox. |
|-------|------|-------------|
| `Lecturas_Semana_Agua_2023` | Particionada por año | ~52 semanas |
| `Lecturas_Semana_Agua_2024` | Particionada por año | ~52 semanas |
| `Lecturas_Semana_Agua_2025` | Particionada por año | ~52 semanas |
| `Lecturas_Semana_Agua_2026` | Particionada por año | ~52 semanas |
| `Lecturas_Semana_Agua_consumo_2023` | Particionada por año | ~52 semanas |
| `Lecturas_Semana_Agua_consumo_2024` | Particionada por año | ~52 semanas |
| `Lecturas_Semana_Agua_consumo_2025` | Particionada por año | ~52 semanas |
| `Lecturas_Semana_Agua_consumo_2026` | Particionada por año | ~52 semanas |
| `lecturas_semanales_gas_2023` | Particionada por año | ~52 semanas |
| `lecturas_semanales_gas_2024` | Particionada por año | ~52 semanas |
| `lecturas_semanales_gas_2025` | Particionada por año | ~52 semanas |
| `lecturas_semanales_gas_2026` | Particionada por año | ~52 semanas |
| `lecturas_semanales_gas_consumo_2023` | Particionada por año | ~52 semanas |
| `lecturas_semanales_gas_consumo_2024` | Particionada por año | ~52 semanas |
| `lecturas_semanales_gas_consumo_2025` | Particionada por año | ~52 semanas |
| `lecturas_semanales_gas_consumo_2026` | Particionada por año | ~52 semanas |
| `lecturas_diarias` | Única (todos los años) | ~365+ días |
| `lecturas_diarias_consumo` | Única (todos los años) | ~365+ días |
| `lecturas_mensuales_agua` | Única (todos los años) | ~12+ meses |
| `lecturas_mensuales_agua_consumo` | Única (todos los años) | ~12+ meses |
| `lecturas_mensuales_gas` | Única (todos los años) | ~12+ meses |
| `lecturas_mensuales_gas_consumo` | Única (todos los años) | ~12+ meses |
| `lecturas_ptar` | Única (todos los años) | ~365+ días |
| `ptar_lecturas` | Única | Resumen semanal PTAR |
| `profiles` | Única | Por usuario registrado |
| `well_events` | Única | Por evento/alerta |
| `well_comments` | Única | Por comentario |
| `reading_comments` | Única | Por comentario |
| `correos` | Única | Por mensaje de contacto |
| `factores_agua` | Única | Factores de conversión |
| `well_users` | Única | Usuarios de pozos |
| `well_config` | Única | Configuración de pozos |
| `alert_scan_state` | Única | Estado de escaneo de alertas |
| `bienvenida` | Única | Eventos de bienvenida |
| `weekly_comments` | Única | **NUEVO (v2.0):** Comentarios semanales por recurso |
| `_prisma_migrations` | Única | Migraciones de Prisma (legacy) |

### 3.3 Convención de Nombres

| Patrón | Ejemplo | Tipo de Datos |
|--------|---------|---------------|
| `lecturas_semana_agua_{año}` | `lecturas_semana_agua_2026` | Lecturas semanales de agua (por año) |
| `lecturas_semana_agua_consumo_{año}` | `lecturas_semana_agua_consumo_2026` | Consumo semanal de agua (por año) |
| `lecturas_semanales_gas_{año}` | `lecturas_semanales_gas_2026` | Lecturas semanales de gas (por año) |
| `lecturas_semanales_gas_consumo_{año}` | `lecturas_semanales_gas_consumo_2026` | Consumo semanal de gas (por año) |
| `lecturas_diarias` | (única) | Lecturas diarias de agua |
| `lecturas_ptar` | (única) | Lecturas diarias PTAR |
| `lecturas_mensuales_agua` | (única) | Lecturas mensuales de agua |
| `lecturas_mensuales_gas` | (única) | Lecturas mensuales de gas |

> **Nota:** Las tablas semanales (agua y gas) están **particionadas por año** debido al gran número de columnas (~170 para agua, ~60 para gas), mientras que las tablas diarias, mensuales y PTAR son **tablas únicas multianuales**.

---

## 4. Roles de Usuario

### 4.1 Roles Definidos (7 roles)

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso total al sistema |
| `ejecutivo` | Acceso de solo lectura a todos los módulos |
| `datos` | Captura y edición de datos únicamente |
| `water` | Gestión de agua (lectura de datos) |
| `gas` | Gestión de gas + alertas + análisis |
| `ptar` | Gestión de PTAR + alertas + análisis |
| `user` | Acceso de solo lectura básico |

> **Nota (v2.0):** El rol `user` no aparece explícitamente en `PERMISSIONS` del archivo `src/config/permissions.js`; `getRolePermissions('user')` cae en el fallback `{}` (sin permisos). No obstante, las rutas se protegen por guardián (`PermissionRoute`, `DataRoute`, etc.) y el sidebar controla el acceso por `allowedRoles`.

### 4.2 Matriz de Permisos

La matriz real del código (`src/config/permissions.js`) incluye **6 roles definidos** (sin `user` explícito) y **11 permisos** (incluye `contact`). Los permisos no listados adicionales a la siguiente tabla son `contact` y `correos`:

| Permiso | admin | ejecutivo | datos | water | gas | ptar |
|---------|-------|-----------|-------|-------|-----|------|
| dashboard | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| water | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| gas | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| ptar | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ |
| alerts | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| predictions | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| analysis | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| addData | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| excelToSql | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| correos | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| contact | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |

### 4.3 Archivo de Permisos (`src/config/permissions.js`)

```javascript
export const ROLES = {
  ADMIN: 'admin',
  EJECUTIVO: 'ejecutivo',
  DATOS: 'datos',
  WATER: 'water',
  GAS: 'gas',
  PTAR: 'ptar',
  USER: 'user',
};

export const PERMISSIONS = {
  admin: {
    water: true, gas: true, ptar: true, alerts: true,
    predictions: true, analysis: true, contact: true,
    addData: true, correos: true, excelToSql: true, dashboard: true,
  },
  ejecutivo: {
    water: true, gas: true, ptar: true, alerts: true,
    predictions: true, analysis: true, contact: true,
    addData: false, correos: false, excelToSql: false, dashboard: true,
  },
  datos: {
    water: true, gas: true, ptar: false,
    alerts: false, predictions: false, analysis: false, contact: false,
    addData: true, correos: false, excelToSql: true, dashboard: true,
  },
  water: {
    water: true, gas: true, ptar: true,
    alerts: false, predictions: false, analysis: false, contact: false,
    addData: false, correos: false, excelToSql: false, dashboard: false,
  },
  gas: {
    water: true, gas: true, ptar: false,
    alerts: true, predictions: true, analysis: true, contact: true,
    addData: false, correos: false, excelToSql: false, dashboard: true,
  },
  ptar: {
    water: false, gas: false, ptar: true,
    alerts: true, predictions: false, analysis: true, contact: true,
    addData: false, correos: false, excelToSql: false, dashboard: true,
  },
};
```

### 4.4 Hook de Permisos (`src/hooks/usePermissions.js`)

```javascript
import { useAuth } from '../contexts/AuthContextNew';
import { hasPermission, getRolePermissions } from '../config/permissions';

export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const can = (permission) => hasPermission(role, permission);
  const permissions = getRolePermissions(role);
  return {
    can,
    permissions,
    role,
    canViewWater: can('water'),
    canViewGas: can('gas'),
    canViewPTAR: can('ptar'),
    canAddData: can('addData'),
    canViewCorreos: can('correos'),
    canUseExcelToSql: can('excelToSql'),
  };
};
```

### 4.5 Redirección post-login por rol

| Rol | Ruta de redirección |
|-----|-------------------|
| `datos` | `/agregar-lecturas` |
| Tiene permiso `dashboard` | `/dashboard` |
| Tiene permiso `water` | `/consumo` |
| Tiene permiso `gas` | `/consumo-gas` |
| Tiene permiso `ptar` | `/ptar` |
| Fallback | `/` |

---

## 5. Stack Tecnológico Actual

### 5.1 Dependencias de Producción

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `react` | ^19.2.3 | Librería principal de UI |
| `react-dom` | ^19.2.3 | Renderizado DOM |
| `react-router` | ^7.8.2 | Enrutamiento SPA |
| `@supabase/supabase-js` | ^2.58.0 | Cliente de Supabase (Auth + DB + Realtime) |
| `tailwindcss` | ^4.1.12 | Framework CSS utilitario |
| `chart.js` | ^4.5.0 | Librería de gráficas |
| `react-chartjs-2` | ^5.3.0 | Wrapper React para Chart.js |
| `recharts` | ^3.4.1 | Librería de gráficas React-native |
| `lightweight-charts` | ^5.0.8 | Gráficas financieras/velas |
| `three` | ^0.180.0 | 3D (efecto de agua) |
| `@react-three/fiber` | ^9.3.0 | React renderer para Three.js |
| `@react-three/drei` | ^10.7.6 | Utilidades para React Three Fiber |
| `framer-motion` | ^12.23.24 | Animaciones declarativas |
| `gsap` | ^3.14.2 | Animaciones profesionales (landing) |
| `lucide-react` | ^0.542.0 | Iconos |
| `react-icons` | ^5.6.0 | Iconos adicionales |
| `xlsx` | ^0.18.5 | Procesamiento de archivos Excel |
| `clsx` | ^ | Utilidad de clases CSS condicionales |
| `tailwind-merge` | ^ | Fusión de clases Tailwind |

### 5.2 Dependencias de Desarrollo

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `vite` | ^7.1.2 | Bundler y dev server |
| `@vitejs/plugin-react-swc` | ^4.0.0 | Plugin Vite para React con SWC |
| `@tailwindcss/vite` | ^4.1.12 | Plugin Vite para TailwindCSS 4 |
| `eslint` | ^9.33.0 | Linter |
| `supabase` | ^2.81.3 | CLI de Supabase |

### 5.3 Configuración de Vite (`vite.config.js`)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()]
})
```

### 5.4 Variables de Entorno (`.env`)

```env
VITE_SUPABASE_URL=https://nunpwqrbgutkelhuwyfy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...  # Anon key (pública)
VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec  # Google Apps Script para formulario de contacto
VITE_SCRIPT_PREDICT_URL=...            # Script de predicción
VITE_ML_API_URL=...                    # ⬅ NUEVO (v2.0): URL base de la API de Machine Learning para predicciones
```

> **Nota (v2.0):** Se añadieron `VITE_SCRIPT_PREDICT_URL` y `VITE_ML_API_URL`. La API de ML se consume desde `src/services/predictionService.js` (endpoints: `/health`, `/info`, `/predict`).

### 5.5 Despliegue

| Plataforma | Archivo | Configuración |
|-----------|---------|---------------|
| **Vercel** | `vercel.json` | `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` |
| **Netlify** | `netlify.toml` | `[[redirects]] { from = "/*", to = "/index.html", status = 200 }` |

### 5.6 Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `vite` | Inicia servidor de desarrollo |
| `build` | `vite build` | Compila para producción |
| `preview` | `vite preview` | Vista previa del build |
| `lint` | `eslint .` | Ejecuta linter |

---

## 6. Normalización de la Base de Datos

### 6.1 Esquema General

La base de datos utiliza **PostgreSQL 15+** en Supabase. No existen claves foráneas explícitas; las relaciones son puramente lógicas. Las tablas se organizan en los siguientes dominios:

### 6.2 Tablas de Agua (Semanales)

#### `lecturas_semana_agua_{año}` (4 tablas: 2023-2026)

```sql
CREATE TABLE "Lecturas_Semana_Agua_2023" (
    "L_id" SERIAL PRIMARY KEY,
    "L_numero_semana" INTEGER UNIQUE NOT NULL,
    "L_fecha_inicio" DATE,
    "L_fecha_fin" DATE,
    "L_medidor_general_pozos" DECIMAL(10,2),
    "L_pozo_11" DECIMAL(10,2),
    "L_pozo_14" DECIMAL(10,2),
    "L_pozo_12" DECIMAL(10,2),
    "L_pozo_7" DECIMAL(10,2),
    "L_pozo_3" DECIMAL(10,2),
    "L_pozo_4_riego" DECIMAL(10,2),
    "L_pozo_8_riego" DECIMAL(10,2),
    "L_pozo_15_riego" DECIMAL(10,2),
    "L_circuito_8_campus" DECIMAL(10,2),
    "L_auditorio_luis_elizondo" DECIMAL(10,2),
    "L_cdb2" DECIMAL(10,2),
    "L_arena_borrego" DECIMAL(10,2),
    "L_edificio_negocios_daf" DECIMAL(10,2),
    "L_aulas_6" DECIMAL(10,2),
    "L_domo_cultural" DECIMAL(10,2),
    -- + 130 columnas adicionales de puntos de medición
    "L_created_at" TIMESTAMPTZ DEFAULT NOW(),
    "L_updated_at" TIMESTAMPTZ DEFAULT NOW()
);
```

**Total de columnas por tabla:** ~170 columnas DECIMAL(10,2).  
**Registros por tabla:** ~52 semanas.

#### `Lecturas_Semana_Agua_consumo_{año}` (4 tablas)

Misma estructura que las tablas de lecturas, pero con prefijo `LC_` en lugar de `L_`. Contiene los valores de **consumo calculado** (derivado de las lecturas).

### 6.3 Tablas de Gas (Semanales)

#### `lecturas_semanales_gas_{año}` (4 tablas: 2023-2026)

```sql
CREATE TABLE "lecturas_semanales_gas_2023" (
    "id" SERIAL PRIMARY KEY,
    "numero_semana" INTEGER,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "campus_acometida_principal_digital" DECIMAL(15,3),
    "domo_cultural" DECIMAL(15,3),
    "comedor_centrales_tec_food" DECIMAL(15,3),
    "dona_tota" DECIMAL(15,3),
    "biotecnologia" DECIMAL(15,3),
    "caldera_1_leon" DECIMAL(15,3),
    "mega_calefaccion_1" DECIMAL(15,3),
    "mega_calefaccion_2" DECIMAL(15,3),
    -- + 50 columnas adicionales
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);
```

**Total de columnas por tabla:** ~60 columnas DECIMAL(15,3).  
**Registros por tabla:** ~52 semanas.

### 6.4 Tabla PTAR

#### `lecturas_ptar`

```sql
CREATE TABLE "lecturas_ptar" (
    "id" SERIAL PRIMARY KEY,
    "fecha" DATE UNIQUE NOT NULL,
    "hora" TIME,
    "medidor_entrada" DECIMAL(10,2),
    "medidor_salida" DECIMAL(10,2),
    "ar" DECIMAL(10,2),          -- Agua Residual
    "at" DECIMAL(10,2),          -- Agua Tratada
    "recirculacion" DECIMAL(10,2),
    "total_dia" DECIMAL(10,2),   -- ar + at + recirculacion
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);
```

#### Vistas PTAR

```sql
CREATE VIEW "vista_ptar_resumen_anual" AS
SELECT
    EXTRACT(YEAR FROM fecha) AS año,
    COUNT(*) AS dias_registrados,
    SUM(ar) AS total_ar,
    SUM(at) AS total_at,
    SUM(recirculacion) AS total_recirculacion,
    AVG(at / NULLIF(ar, 0)) * 100 AS eficiencia_promedio
FROM lecturas_ptar
GROUP BY EXTRACT(YEAR FROM fecha);

-- Vistas similares para mensual y trimestral
```

### 6.5 Tablas Diarias de Agua

#### `lecturas_diarias`

```sql
CREATE TABLE "lecturas_diarias" (
    "id" SERIAL PRIMARY KEY,
    "mes_anio" VARCHAR(20),      -- Ej: "enero 2026"
    "mes" INTEGER,
    "anio" INTEGER,
    "dia_hora" VARCHAR(20),      -- Ej: "Lun12 09:00"
    "consumo" DECIMAL(10,2),
    "general_pozos" DECIMAL(10,2),
    "pozo_3" DECIMAL(10,2),
    -- + columnas de pozos y puntos
    "a_y_d" DECIMAL(10,2),
    "campus_8" DECIMAL(10,2),
    "a7_cc" DECIMAL(10,2),
    "megacentral" DECIMAL(10,2),
    "planta_fisica" DECIMAL(10,2),
    "residencias" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.6 Tablas Mensuales

#### `lecturas_mensuales_agua` / `lecturas_mensuales_agua_consumo`

Tablas únicas (multianuales) con columnas similares a las semanales pero con granularidad mensual.

#### `lecturas_mensuales_gas` / `lecturas_mensuales_gas_consumo`

Estructura similar a las tablas semanales de gas pero con agregación mensual.

### 6.7 Tablas de Autenticación

#### `profiles`

```sql
CREATE TABLE "profiles" (
    "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "email" VARCHAR(255),
    "username" VARCHAR(100),
    "full_name" VARCHAR(255),
    "company" VARCHAR(255),
    "role" VARCHAR(50) DEFAULT 'user'
        CHECK (role IN ('admin', 'ejecutivo', 'datos', 'water', 'gas', 'ptar', 'user')),
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- RLS habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);
```

### 6.8 Tablas de Alertas y Eventos

#### `well_events`

```sql
CREATE TABLE "well_events" (
    "id" SERIAL PRIMARY KEY,
    "well_id" VARCHAR(100),
    "event_type" VARCHAR(50) NOT NULL,
    "event_status" VARCHAR(20) DEFAULT 'activo'
        CHECK (event_status IN ('activo', 'completado', 'cancelado')),
    "severity" VARCHAR(20) CHECK (severity IN ('critica', 'preventiva', 'informativa')),
    "title" VARCHAR(255),
    "description" TEXT,
    "alert_granularity" VARCHAR(20),     -- daily | weekly | monthly
    "alert_week" INTEGER,
    "alert_month" INTEGER,
    "alert_year" INTEGER,
    "alert_date" DATE,                      -- ⬅ NUEVO: fecha para alertas diarias
    "meter_column" VARCHAR(100),            -- ⬅ NUEVO: columna del medidor
    "metric_value" DECIMAL(15,3),           -- ⬅ NUEVO: valor de la métrica
    "threshold_value" DECIMAL(15,3),        -- ⬅ NUEVO: valor de referencia
    "is_automatic" BOOLEAN DEFAULT false,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "author_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- CHECK de event_type (v2.0): reemplaza el antiguo; ya NO incluye
-- 'alerta_consumo', 'sobreconsumo' ni 'posible_fuga'
ALTER TABLE well_events DROP CONSTRAINT IF EXISTS well_events_event_type_check;
ALTER TABLE well_events ADD CONSTRAINT well_events_event_type_check
  CHECK (event_type IN (
    'mantenimiento', 'parado', 'reparacion', 'inspeccion', 'otro',
    'anomalia_sobreconsumo'
  ));

-- Índices
CREATE INDEX idx_well_events_well_id ON well_events(well_id);
CREATE INDEX idx_well_events_status ON well_events(event_status);
CREATE INDEX idx_well_events_type ON well_events(event_type);

-- Índices únicos parciales para deduplicación por periodo (v2.0)
-- Garantizan UNA sola alerta automática por lectura
CREATE UNIQUE INDEX idx_well_events_anomalia_daily
  ON well_events (alert_date)
  WHERE event_type = 'anomalia_sobreconsumo'
    AND alert_granularity = 'daily'
    AND is_automatic = true;

CREATE UNIQUE INDEX idx_well_events_anomalia_weekly
  ON well_events (alert_week, alert_year)
  WHERE event_type = 'anomalia_sobreconsumo'
    AND alert_granularity = 'weekly'
    AND is_automatic = true;

CREATE UNIQUE INDEX idx_well_events_anomalia_monthly
  ON well_events (alert_year, alert_month)
  WHERE event_type = 'anomalia_sobreconsumo'
    AND alert_granularity = 'monthly'
    AND is_automatic = true;

-- Realtime habilitado con REPLICA IDENTITY FULL
ALTER TABLE well_events REPLICA IDENTITY FULL;
```

> **Nota (v2.0):** Se añadieron `alert_date`, `meter_column`, `metric_value` y `threshold_value` a `well_events`. El CHECK de `event_type` ahora permite `anomalia_sobreconsumo` y **elimina** los antiguos `alerta_consumo`, `sobreconsumo` y `posible_fuga`. Los **índices únicos parciales** garantizan una sola alerta automática por lectura (diaria por `alert_date`, semanal por `(alert_week, alert_year)`, mensual por `(alert_year, alert_month)`).

#### `well_comments`

```sql
CREATE TABLE "well_comments" (
    "id" SERIAL PRIMARY KEY,
    "well_id" VARCHAR(100),
    "comment_text" TEXT,
    "author_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);
```

#### `reading_comments`

```sql
CREATE TABLE "reading_comments" (
    "id" SERIAL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL,
    "point_id" VARCHAR(100) NOT NULL,
    "comment" TEXT,
    "author" VARCHAR(255),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, week_number, point_id)
);
```

### 6.9 Tabla de Contacto

#### `correos`

```sql
CREATE TABLE "correos" (
    "id" SERIAL PRIMARY KEY,
    "remitente" VARCHAR(255),
    "email" VARCHAR(255),
    "telefono" VARCHAR(50),
    "empresa" VARCHAR(255),
    "asunto" VARCHAR(255),
    "mensaje" TEXT,
    "leido" BOOLEAN DEFAULT false,
    "importante" BOOLEAN DEFAULT false,
    "categoria" VARCHAR(100),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.9b Tabla de Comentarios Semanales (NUEVO en v2.0)

#### `weekly_comments`

```sql
CREATE TABLE public.weekly_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_number INTEGER NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'agua',   -- agua | gas
    comment TEXT NOT NULL,
    author UUID REFERENCES public.profiles(id),  -- FK al UUID de la sesión autenticada
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_weekly_comment UNIQUE (week_number, source_type)
);
```

- Un solo comentario por (semana, recurso)
- Índices en `week_number`, `source_type`, `created_at`
- RLS: CRUD permitido a todos los usuarios autenticados
- Trigger para actualizar `updated_at`

### 6.9c Columnas Nuevas de Agua (v2.0)

Se añadieron dos nuevas columnas a las tablas de agua (semanales y mensuales, lecturas y consumo):

| Columna | Tipo | Tablas |
|---------|------|--------|
| `l_lago_aulas_7_llenado` | `NUMERIC(15,3)` | `lecturas_semana_agua_{año}`, `lecturas_semana_agua_consumo_{año}` (2023-2026), `lecturas_mensuales_agua`, `lecturas_mensuales_agua_consumo` |
| `l_sedes_site_boma` | `NUMERIC(15,3)` | Mismas tablas |

Estas columnas se agregan vía `add_l_lago_aulas_7_llenado_column.sql` y `add_l_sedes_site_boma_column.sql` y se incluyen en los flujos de alta/edición de lecturas (`AddWeeklyReadingsPage`, `EditWeeklyReadingsPage`, `AddMonthlyWaterReadingsPage`, `EditMonthlyWaterReadingsPage`).

### 6.10 Políticas RLS (Row Level Security)

Se aplican aproximadamente 30 políticas RLS en las tablas del sistema. Las principales son:

| Tabla | Política | Descripción |
|-------|----------|-------------|
| `profiles` | SELECT: `auth.uid() = id` | Usuarios ven su propio perfil |
| `profiles` | UPDATE: `auth.uid() = id` | Usuarios editan su propio perfil |
| `well_events` | SELECT: autenticados | Todos los usuarios autenticados pueden ver |
| `well_events` | INSERT: autenticados | Usuarios autenticados pueden crear |
| `well_comments` | CRUD: autenticados | Control de acceso a comentarios |
| `weekly_comments` | CRUD: autenticados | **NUEVO (v2.0):** Todos los autenticados pueden leer/insertar/actualizar/eliminar |
| `correos` | Admin-only | Solo admin puede leer correos |

### 6.11 Triggers y Funciones

Existen aproximadamente 35 triggers y 30 funciones en la base de datos. Los más importantes:

- **Triggers de timestamp**: Actualizan `updated_at` automáticamente en cada tabla
- **Funciones de alerta**: Escanean patrones de sobreconsumo (sistema unificado desde v2.0)
- **Función `insert_bulk_data`**: Permite inserciones masivas con `SECURITY DEFINER` para bypass RLS
- **Jobs de pg_cron**: Los 4 jobs de alertas antiguos fueron **desprogramados** por la migración `supabase_unifica_alertas_anomalia.sql` (el nuevo sistema usa triggers sobre las tablas de consumo)

> **Nota (v2.0):** La migración `supabase_unifica_alertas_anomalia.sql` limpia de forma idempotente todos los jobs pg_cron y triggers/event triggers anteriores, unificando el sistema de alertas bajo `anomalia_sobreconsumo`.

---

## 7. Alertas en Tiempo Real

> **Cambio mayor en v2.0:** El sistema de alertas fue **completamente unificado**. Los 3 tipos automáticos anteriores (`alerta_consumo`, `sobreconsumo`, `posible_fuga`) fueron reemplazados por **un único tipo `anomalia_sobreconsumo`**. Esto afecta tanto a la base de datos (migración `supabase_unifica_alertas_anomalia.sql`) como al frontend (`wellAlertEvaluator.js`, `wellAlertSync.js`, `AlertsPage.jsx`).

### 7.1 Arquitectura General (3 Capas)

```
+-------------------+       +------------------+       +------------------+
|   Capa Lógica     |       |  Capa Sync       |       |  Capa UI         |
| (wellAlertEval)   |       | (wellAlertSync)  |       | (AlertsPage)     |
|                   |       |                  |       |                  |
| evaluateDaily     | ----> | getExistingAuto  | ----> | Realtime sub     |
| evaluateWeekly    |       | alertKey()       |       | INSERT/UPDATE    |
| evaluateMonthly   |       | dedup + insert   |       | filtros + acc.   |
| evaluateAnomaly() |       | updateStatus()   |       |                  |
+-------------------+       +------------------+       +------------------+
                                    |
                                    v
                            +------------------+
                            |  Supabase DB     |
                            |  well_events     |
                            |  + Realtime      |
                            +------------------+
```

### 7.2 Reglas de Evaluación (NUEVO: 3 reglas unificadas AND)

Cada lectura (diaria / semanal / mensual) se evalúa en `src/utils/wellAlertEvaluator.js` con **las mismas 3 reglas simultáneas** (condición AND). Se requiere que **todas** se cumplan y que el consumo actual supere **>30%** los valores de referencia:

| # | Regla | Condición |
|---|-------|-----------|
| R1 | vs promedio móvil | consumo actual > promedio móvil de los **10 periodos anteriores** × 1.30 |
| R2 | vs periodo anterior | consumo actual > periodo inmediatamente anterior × 1.30 |
| R3 | vs mismo periodo del año anterior | consumo actual > mismo periodo del año anterior × 1.30 |

**Severidad:** Siempre `preventiva`.  
**Tipo de evento:** Siempre `anomalia_sobreconsumo`.  
**Consolidación:** Si varios medidores incumplen las 3 reglas, se genera **UNA sola alerta** por periodo, guardando en `meter_column`/`metric_value` al medidor con **mayor consumo**.

#### Funciones del evaluador

| Función | Granularidad | Descripción |
|---------|-------------|-------------|
| `evaluateDailyAnomaly(readings, current?)` | `daily` | Evalúa una lectura diaria, comparando contra 7 días atrás y mismo día del año anterior |
| `evaluateWeeklyAnomaly(readings, current?)` | `weekly` | Evalúa una lectura semanal, comparando contra semana anterior y misma semana del año anterior |
| `evaluateMonthlyAnomaly(readings, current?)` | `monthly` | Evalúa una lectura mensual, comparando contra mes anterior y mismo mes del año anterior |
| `evaluateAnomaly(granularity, readings, current?)` | — | Dispatcher principal por granularidad |

#### Estructura de la alerta generada

```javascript
{
  event_type: 'anomalia_sobreconsumo',
  severity: 'preventiva',
  title: 'Anomalía de sobreconsumo detectada — Semana 12/2026 (42.3 m³)',
  description: 'El consumo ... supera en más del 30% los valores de referencia en las 3 reglas...',
  recommendation: 'Revisar el medidor y las líneas de distribución del periodo reportado...',
  metric_value: 42.3,
  threshold_value: 0,
  alert_granularity: 'weekly',   // 'daily' | 'weekly' | 'monthly'
  alert_week / alert_month / alert_year / alert_date,  // según granularidad
  meter_column: 'l_pozo_3',
  is_automatic: true,
  well_id: null,
  event_status: 'activo',
  author_name: 'Sistema Automático'
}
```

### 7.3 Sincronización (Deduplicación por periodo)

El sistema garantiza **UN solo evento por periodo** (granularidad + periodo), no por medidor:

```javascript
function alertKey(alert) {
  const granularity = alert.alert_granularity
  if (granularity === 'daily')   return `anomalia_sobreconsumo_daily_${alert.alert_date}`
  if (granularity === 'weekly')  return `anomalia_sobreconsumo_weekly_${alert.alert_year}_${alert.alert_week}`
  if (granularity === 'monthly') return `anomalia_sobreconsumo_monthly_${alert.alert_year}_${alert.alert_month}`
}

// Filtra solo alertas nuevas
const existingKeys = new Set(existing.map(alertKey))
const newAlerts = alerts.filter(alert => !existingKeys.has(alertKey(alert)))
```

La función `syncAutomaticAlerts(alerts)` en `src/utils/wellAlertSync.js`:
1. Consulta alertas existentes (`getExistingAutoAlerts(year)`)
2. Filtra las que ya existen por periodo
3. Inserta solo las nuevas
4. Nunca sobrescribe alertas que el usuario ya marcó como `completado` o `cancelado`
5. Maneja conflictos `23505` (índice único) sin duplicar

### 7.4 Canales Realtime de Supabase

| Ubicación | Channel | Tabla | Eventos |
|-----------|---------|-------|---------|
| `WellsPage.jsx` | `well-events-realtime` | `well_events` | INSERT, UPDATE, DELETE |
| `AlertsPage.jsx` | `alerts-page-realtime` | `well_events` | INSERT, UPDATE, DELETE |
| `WellDetailPage.jsx` | (implícito) | `well_events` | Según implementación |

#### Patrón de suscripción Realtime (AlertsPage.jsx)

```javascript
useEffect(() => {
  const channel = supabase
    .channel('alerts-page-realtime')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'well_events' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newEvent = payload.new
          if (newEvent.event_type === 'anomalia_sobreconsumo') {
            setAlerts(prev => [newEvent, ...prev])
          }
        }
        if (payload.eventType === 'UPDATE') {
          setAlerts(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
        }
        if (payload.eventType === 'DELETE') {
          setAlerts(prev => prev.filter(a => a.id !== payload.old.id))
        }
      }
    )
    .subscribe((status) => console.log('📡 AlertsPage Realtime status:', status))

  return () => { supabase.removeChannel(channel) }
}, [])
```

### 7.5 Carga Inicial de Alertas

```javascript
const { data, error } = await supabase
  .from('well_events')
  .select('*')
  .eq('event_type', 'anomalia_sobreconsumo')
  .order('created_at', { ascending: false })
  .limit(200)
```

### 7.6 Acciones sobre Alertas

| Acción | Función | Descripción |
|--------|---------|-------------|
| Atender | `updateAlertStatus(id, 'completado')` | Marca alerta como resuelta y registra `end_date` |
| Descartar | `updateAlertStatus(id, 'cancelado')` | Descarta alerta |

### 7.7 Interfaz de AlertsPage (v2.0)

La página de alertas (`AlertsPage.jsx`) muestra **estadísticas** (Total, Activas, Atendidas, Descartadas), **búsqueda** (título, descripción, medidor), y **filtros por periodicidad** (diaria/semanal/mensual) y **estado** (activo/completado/cancelado).

Cada tarjeta de alerta muestra:
- Título (`evt.title`)
- Descripción (`evt.description`)
- Recomendación (`evt.recommendation`) con prefijo 💡
- Medidor responsable (`meter_column` formateado, ej: "Ciap Andatti")
- Periodicidad (Diaria/Semanal/Mensual)
- Periodo (`formatPeriod`: fecha, `Semana X/Y` o mes/año)
- Tiempo relativo de creación (`timeAgo`)
- Fecha de cierre si está atendida
- Botones Atender (verde) / Descartar (gris) solo si está activa

### 7.8 Alertas Automáticas (pg_cron)

La migración `supabase_unifica_alertas_anomalia.sql` **desprograma todos los jobs pg_cron antiguos** (`scan_fuga_alerts_diario`, `scan_fuga_alerts_semanal`, `scan_fuga_alerts_mensual`, `scan_consumption_alerts`, `scan_anomalia_diario/semanal/mensual`) y elimina las funciones/triggers automáticos legacy. El nuevo sistema se basa en triggers sobre las tablas de consumo:

| Trigger | Tabla | Propósito |
|---------|-------|-----------|
| (nuevo sistema unificado) | `lecturas_diarias_consumo` | Evalúa lecturas diarias al insertar |
| (nuevo sistema unificado) | `lecturas_semana_agua_consumo_{año}` | Evalúa lecturas semanales |
| (nuevo sistema unificado) | `lecturas_mensuales_agua_consumo` | Evalúa lecturas mensuales |

> **Nota:** El sistema también puede ejecutarse de forma manual desde el frontend vía `evaluateAnomaly()` + `syncAutomaticAlerts()`. Las columnas `meter_column` y `metric_value` se agregaron a `well_events` para el nuevo sistema unificado. La función `consolidate` garantiza que cada periodo tenga solo una alerta (la del medidor de mayor consumo).

---

## 8. Flujo de Datos Frontend-Backend

### 8.1 Conexión a Supabase

**Archivo:** `src/supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Patrón:** Cliente singleton compartido en toda la app. Los canales Realtime se crean bajo demanda desde esta misma instancia.

### 8.2 Patrón de Lectura (Supabase → UI)

Todas las páginas siguen un patrón consistente:

```
[Componente se monta]
       |
       v
[setLoading(true)]
       |
       v
[fetchData()] ──> supabase.from('tabla').select('*').order(...)
       |                      |
       v                      v
[setData(result)]        [catch error]
       |                      |
       v                      v
[setLoading(false)]     [setError(msg)]
       |
       v
[Render condicional: loading ? <Spinner /> : error ? <ErrorMsg /> : empty ? <EmptyState /> : <DataView />]
```

#### Ejemplo: DashboardPage.jsx (refactorizado v2.0)

Antes consultaba 4 tablas en paralelo (`Promise.all`). Ahora carga **una única tabla** (`lecturas_semana_agua_consumo_2026`) y deriva top/bottom consumidores de la semana seleccionada:

```javascript
const CONSUMPTION_TABLE = 'lecturas_semana_agua_consumo_2026'
const { data, error: fetchError } = await supabase
  .from(CONSUMPTION_TABLE)
  .select('*')
  .order('l_numero_semana', { ascending: true })

// Top/bottom consumidores con helpers extraídos
const { top5, bottom5 } = getTopAndBottomConsumers(points, weekNumber, 5)
```

#### Tablas dinámicas por año (ConsumptionPage)

```javascript
const readingsTableName = `lecturas_semana_agua_${selectedYear}`
const consumptionTableName = `lecturas_semana_agua_consumo_${selectedYear}`

const mergedData = readingsData.map(reading => {
  const consumo = consumptionData.find(
    c => c.l_numero_semana === reading.l_numero_semana
  )
  return { ...reading, consumption: consumo || {} }
})
```

#### Comparación multianual

```javascript
const fetchBothYearsData = async () => {
  await Promise.all([
    fetchYearData('2023', 'lecturas_semana_agua_consumo_2023', setData2023),
    fetchYearData('2024', 'lecturas_semana_agua_consumo_2024', setData2024),
    fetchYearData('2025', 'lecturas_semana_agua_consumo_2025', setData2025),
    fetchYearData('2026', 'lecturas_semana_agua_consumo_2026', setData2026)
  ])
}
```

#### Vistas de BD (PTAR - único caso)

```javascript
const { data: anual } = await supabase
  .from('vista_ptar_resumen_anual').select('*').order('año', false)

const { data: mensual } = await supabase
  .from('vista_ptar_resumen_mensual').select('*').order('año', false).order('mes', false)
```

### 8.3 Patrón de Escritura (UI → Supabase)

#### Wizard de 3 pasos (data entry)

```
[Paso 1: Crear referencia temporal]
   INSERT INTO tabla (numero_semana, fecha_inicio, fecha_fin)
   VALUES (semana, inicio, fin)
       |
       v
[Paso 2: Subir Excel]
   XLSX.read(file) → parseRows() → matchColumns()
       |
       v
[Paso 3: Guardar lecturas]
   UPDATE tabla SET col1=val1, col2=val2, ...
   WHERE numero_semana = X
```

**Patrón de two-phase insert:**

```javascript
// Fase 1: INSERT (solo metadatos)
await supabase.from(tableName).insert([{
  l_numero_semana: weekNumber,
  l_fecha_inicio: startDate,
  l_fecha_fin: endDate
}])

// Fase 2: UPDATE (con todas las lecturas)
await supabase
  .from(tableName)
  .update(weekData)
  .eq('l_numero_semana', weekNumber)

// Consumo: usa UPSERT
await supabase
  .from(consumoTableName)
  .upsert(consumoData, { onConflict: 'l_numero_semana' })
```

**Persistencia del wizard (usePersistedState):**

```javascript
const [step, setStep, clearStep] = usePersistedState('weekly_step', 1)
const [readings, setReadings, clearReadings] = usePersistedState('weekly_readings', {})
```

### 8.4 Flujo de Excel-to-SQL

```
[Usuario sube archivo .xlsx]
       |
       v
[XLSX.read(data, { type: 'array' })]
       |
       v
[ sheets → json ]
       |
       +--> Formato Vertical: cada columna = un registro (semana)
       |     Genera: INSERT INTO tabla (col1, col2) VALUES (v1, v2), (v3, v4);
       |
       +--> Formato Horizontal: cada fila = un registro
             Genera: INSERT INTO tabla (col1, col2) VALUES (v1, v2);
                     INSERT INTO tabla (col1, col2) VALUES (v3, v4);
       |
       v
[Opcional: inserción directa a Supabase]
   supabase.rpc('insert_bulk_data', { p_table_name, p_data })
```

**Arquitectura config-driven:**

```javascript
const config = {
  tipo: 'agua',
  año: 2023,
  nombreTabla: 'Lecturas_Semana_Agua_2023',
  campos: ['L_numero_semana', 'L_fecha_inicio', 'L_fecha_fin', 'L_pozo_11', ...],
  formato: 'vertical',
  color: 'blue'
}

<ExcelToSqlConverter config={config} />
```

### 8.5 Flujo de Predicciones (NUEVO en v2.0)

La sección de predicciones (`/predicciones`, `PredictionsPage.jsx`) se conecta a una **API externa de Machine Learning** para predecir consumo de agua.

```
[PredictionsPage monta]
       |
       v
[usePredictions() hook]
       |
       +--> predictionService.getInfo()            → /info  (metadata, pozos soportados)
       |
       +--> fetchRecentHistoricalData(supabase,
              'lecturas_semana_agua_consumo_2026', 12)   → últimos 12 periodos
       |         (src/lib/predictionMapping.js)
       |
       v
[predictionService.predict(historico)]   → POST /predict
       |
       v
[predictions, historicalData, apiInfo]  → se renderizan
```

#### Servicio de predicción (`src/services/predictionService.js`)

```javascript
const API_URL = import.meta.env.VITE_ML_API_URL

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(errorData.detail || `Error ${response.status}`)
  }
  return response.json()
}

export const predictionService = {
  getHealth()  => request('/health'),
  getInfo()    => request('/info'),
  predict(historicoReciente) => request('/predict', {
    method: 'POST',
    body: JSON.stringify({ historico_reciente: historicoReciente }),
  }),
}
```

#### Mapeo de datos (`src/lib/predictionMapping.js`)

Convierte filas de `lecturas_semana_agua_consumo_{año}` al formato que espera la API de ML:

```javascript
const COLUMN_MAP = {
  l_pozo_3: 'l_pozo_3',
  l_pozo_7: 'l_pozo_7',
  l_pozo_11: 'l_pozo_11',
  l_pozo_12: 'l_pozo_12',
  l_pozo_14: 'l_pozo_14',
  l_medidor_general_pozos: 'medidor_general',
}
```

Pozos soportados por defecto: `pozo_3`, `pozo_7`, `pozo_11`, `pozo_12`, `pozo_14` (pero la API puede indicar cuáles soporta vía `/info`).

### 8.6 Gráficas Comparativas Multiaño (NUEVO en v2.0)

Se introdujeron **componentes reutilizables de comparación multiaño** con colores fijos deterministas por año (`src/utils/chartColors.js`):

| Año | Color |
|-----|-------|
| 2022 | Gris |
| 2023 | Naranja `rgb(245,158,11)` |
| 2024 | Púrpura `rgb(139,92,246)` |
| 2025 | Verde `rgb(34,197,94)` |
| 2026 | Azul `rgb(59,130,246)` (año actual) |
| Futuros | Paleta determinista (hash por año) |

#### Componentes

| Componente | Descripción |
|------------|-------------|
| `WeeklyComparisonChart.jsx` | Gráfica de líneas/barras comparando consumo semanal entre múltiples años. Controles: filtro pozos (todos/riego/servicios), tipo de gráfico, selector de años. Colores de puntos indican aumento >5% (rojo), estable (azul), disminución <0% (verde). Tooltip muestra mes de la semana y % vs semana anterior y YoY. |
| `WeeklyComparisonTable.jsx` | Tabla comparativa semanal lado a lado por año. |
| `MonthlyComparisonChart.jsx` | Gráfica mensual equivalente (12 meses) con formato mexicano (`es-MX`). Usa `MultiYearData` de `{ year, month, monthName, consumption, reading }`. |

Estos componentes se usan en `ConsumptionPage`, `GasConsumptionPage`, `MonthlyWaterConsumptionPage` y `GasComsuptionMontlyPage`.

#### Helpers de comparación

| Util | Propósito |
|------|-----------|
| `src/utils/chartColors.js` | Color fijo por año calendario |
| `src/utils/yearOverYear.js` | `getPreviousYearData`, `calcularCambioPct`, `construirEtiquetaYoY`, `extraerDiaDeDiaHora`, `derivarMesDeLectura` |
| `src/utils/consumptionHelpers.js` | `getPointReading`, `getPointConsumption`, `getTopAndBottomConsumers` |

### 8.7 Flujo de Autenticación Completo

```
[App init] → BrowserRouter → AuthProvider
                                  |
                    +-------------+-------------+
                    |                           |
           [getSession()]           [onAuthStateChange()]
                    |                           |
                    v                           v
           ¿Hay sesión activa?          [login/logout/token refresh]
                    |                           |
                    v                           v
           [fetch profile]              [fetch profile]
           FROM profiles                FROM profiles
           WHERE id = auth.uid()        WHERE id = auth.uid()
                    |                           |
                    v                           v
           { user, role, name }         { user, role, name }
                    |                           |
                    v                           v
           [Context value: user, isAuthenticated, login, logout]
```

### 8.8 Mapa de Estados por Página

| Componente | Loading | Error | Empty | Patrón |
|-----------|---------|-------|-------|--------|
| `DashboardPage` | Spinner global | `setError(msg)` | "No hay datos" | Página (refactorizado v2.0) |
| `ConsumptionPage` | Spinner en selector | `setError(msg)` + mock fallback | "No hay datos" | Página |
| `PTARPage` | Página completa | Card con AlertCircle | "No hay datos" | Página |
| `WellsPage` | Por fila de tabla | Por fila | "No hay datos disponibles" | Por tabla |
| `AlertsPage` | Spinner inicial | console.error | "No hay alertas" | Página |
| `AddWeeklyReadingsPage` | Por paso del wizard | Toast/notificación | N/A | Por paso |
| `PredictionsPage` | Spinner inicial | Mensaje de error | N/A | vía usePredictions |

> **Nota (v2.0):** `DashboardPage` fue reescrito y ya no usa el `Promise.all` multitarjeta anterior. Ahora carga únicamente la tabla `lecturas_semana_agua_consumo_2026` y presenta los top/bottom consumidores de la semana seleccionada (usando `getTopAndBottomConsumers` de `consumptionHelpers`). Además, redirige automáticamente a usuarios con rol `datos` a `/agregar-lecturas`.

### 8.9 Resumen de Patrones de Datos

| Patrón | Descripción | Ejemplos |
|--------|-------------|----------|
| **Direct fetch** | Consultas directas a Supabase sin ORM | Todas las páginas |
| **Two-phase insert** | INSERT metadata → UPDATE values | AddWeeklyReadings, AddDailyReadings |
| **Client-side merge** | Join de tablas de lecturas + consumo en frontend | ConsumptionPage |
| **Static fallback** | Datos mock cuando Supabase falla | DashboardPage (dashboard-data.js) |
| **Config-driven** | Componente genérico impulsado por config | ExcelToSqlConverter |
| **Wizard persistence** | Estado del wizard en localStorage | Todas las Add*Pages |
| **Realtime subscription** | Suscripción a cambios en BD | WellsPage, AlertsPage |
| **Views de BD** | Agregaciones en servidor | PTARPage (vistas anual/mensual/trimestral) |
| **Dinamic table names** | Nombre de tabla construido con año | ConsumptionPage, WellsPage |
| **Multi-year comparison** | Comparar un mismo periodo contra múltiples años con colores fijos | WeeklyComparisonChart, MonthlyComparisonChart, WeeklyComparisonTable |
| **External ML API** | Fetch a API externa de predicción (VITE_ML_API_URL) | PredictionsPage vía usePredictions + predictionService |
| **Pure helpers** | Lógica de cálculo extraída a funciones puras reutilizables | consumptionHelpers, yearOverYear, chartColors |

---

## Apéndice A: Documentación Existente

El proyecto cuenta con **20+ archivos de documentación** en la raíz que cubren:

| Archivo | Tema |
|---------|------|
| `README_PTAR.md` | Sistema PTAR completo |
| `README-COMENTARIOS-LECTURAS.md` | Sistema de comentarios en lecturas |
| `README-COMENTARIOS-EVENTOS.md` | Comentarios y eventos de pozos |
| `DOCUMENTACION_APLICACION.md` | Documentación general (444 líneas) |
| `AUTH_SYSTEM_README.md` | Sistema de autenticación |
| `SISTEMA_PERMISOS.md` | Sistema de permisos (7 roles) |
| `INICIO_RAPIDO.md` | Guía de inicio rápido |
| `ANALYSIS_SECTION_README.md` | Sección de análisis |
| `LECTURA_DIARIAS_PAGE_README.md` | Lecturas diarias |
| `PTAR_GRAFICAS_LOGICA.md` | Lógica de gráficas PTAR |
| `PTAR_PAGE_REFACTOR_SUMMARY.md` | Resumen de refactor PTAR |
| `QUICK_START_ANALYSIS.md` | Inicio rápido de análisis |
| `FUNCIONALIDADES_PLATAFORMA.md` | Funcionalidades de la plataforma |
| `FEATURE_SUMMARY.md` | Resumen de características |
| `GUIA_AUTENTICACION.md` | Guía de autenticación |
| `EJEMPLOS_USO_AUTH.md` | Ejemplos de uso de auth |
| `CREAR_USUARIO_MANUAL.md` | Creación manual de usuarios |
| `EXCEL_TO_SQL_COMPONETIZADO.md` | Documentación Excel-to-SQL |
| `INSTRUCCIONES_CSV_TO_SQL_DIARIO.md` | Instrucciones CSV a SQL diario |
| `INSTRUCCIONES_EXCEL_UPLOAD.md` | Instrucciones de subida Excel |
| `INSTRUCCIONES_RAPIDAS_AUTH.md` | Instrucciones rápidas de auth |
| `INSTRUCCIONES_SEPARACION_TABLAS_POR_ANO.md` | Separación de tablas por año |
| `CAMBIOS_TABLAS_AGUA.md` | Cambios en tablas de agua |
| `RESUMEN_PTAR_WEB.md` | Resumen PTAR web |
| `SOLUCION_AUTH_LOADING.md` | Solución a loading infinito de auth |

## Apéndice B: Puntos de Medición

### Agua (~130+ puntos)

La tabla `lecturas_semana_agua_{año}` contiene aproximadamente 170 columnas que cubren:

- **Pozos**: pozo_11, pozo_14, pozo_12, pozo_7, pozo_3, pozo_4_riego, pozo_8_riego, pozo_15_riego
- **Circuitos**: circuito_8_campus, medidor_general_pozos
- **Edificios**: auditorio_luis_elizondo, cdb2, edificio_negocios_daf, aulas_6, domo_cultural
- **Zonas**: wellness_*, centrales_*, ciap_*, residencias_*, biblioteca_*, caffenio, cedes_*, aulas_*, rectoria_*, estadio_*
- **Áreas deportivas**: arena_borrego, estadio_borrego_*
- **Otros**: planta_fisica, megacentral, a7_cc, a_y_d

### Gas (~60 puntos)

La tabla `lecturas_semanales_gas_{año}` contiene aproximadamente 60 columnas que cubren:

- **Acometida principal**: campus_acometida_principal_digital
- **Edificios**: domo_cultural, biotecnologia, aulas_1, biblioteca
- **Calderas**: caldera_1_leon, mega_calefaccion_1..5, caldera_3
- **Alimentación**: comedor_centrales_tec_food, dona_tota, ciap_super_salads
- **Residencias**: residencias_1..8
- **Zonas**: wellness_*, estadio_borrego_*
- **Otros**: expedition, bread_expedition

### PTAR (8 métricas)

- medidor_entrada, medidor_salida
- ar (agua residual), at (agua tratada)
- recirculacion, total_dia
- fecha, hora

---

*Documentación generada en Junio 2026. Para preguntas o actualizaciones, contactar al equipo de desarrollo.*
