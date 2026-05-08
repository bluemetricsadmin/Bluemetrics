# 🔐 Sistema de Permisos por Rol

## 📋 Roles Disponibles (7 roles)

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso completo a todo |
| `ejecutivo` | Solo lectura de todas las secciones, sin ingreso de datos |
| `datos` | Solo ingreso y edición de datos (sin acceso a vistas de consumo/análisis) |
| `water` | Solo gestión hídrica (agua, pozos, PTAR), sin dashboard ni análisis |
| `gas` | Solo gestión de gas + análisis y alertas |
| `ptar` | Solo planta de tratamiento + alertas y análisis |
| `user` | Lectura completa de todo, sin agregar datos |

---

## 🔑 Matriz de Permisos

| Permiso | admin | ejecutivo | datos | water | gas | ptar | user |
|---------|-------|-----------|-------|-------|-----|------|------|
| `dashboard` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `water` (vistas agua) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `gas` (vistas gas) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `ptar` (vista PTAR) | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| `alerts` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `predictions` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `analysis` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `addData` (ingreso datos) | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `excelToSql` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `correos` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> Definido en `src/config/permissions.js`

---

## 🎯 Rutas y Acceso por Rol

### Rutas Públicas (sin login)
| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/contacto` | Contacto |
| `/confirmacion` | Confirmación |

---

### Dashboard
| Ruta | Guard | Roles con acceso |
|------|-------|-----------------|
| `/dashboard` | `PermissionRoute "dashboard"` | admin, ejecutivo, datos, gas, ptar, user |

> ⚠️ El rol `water` **no tiene acceso** al dashboard.

---

### Gestión Hídrica (permiso: `water`)
| Ruta | Descripción |
|------|-------------|
| `/consumo` | Consumo semanal de agua |
| `/consumo-mensual-agua` | Consumo mensual de agua |
| `/pozos` | Lista de pozos |
| `/pozos/:id` | Detalle de pozo |
| `/lecturas-diarias` | Lecturas diarias |
| `/balance` | Balance hídrico (usa permiso `dashboard`) |

**Roles con acceso**: `admin`, `ejecutivo`, `datos`, `water`, `gas`, `user` — ❌ NO `ptar`

---

### Gestión de Gas (permiso: `gas`)
| Ruta | Descripción |
|------|-------------|
| `/consumo-gas` | Consumo semanal de gas |
| `/consumo-mensual-gas` | Consumo mensual de gas |

**Roles con acceso**: `admin`, `ejecutivo`, `datos`, `water`, `gas`, `user` — ❌ NO `ptar`

---

### PTAR (permiso: `ptar`)
| Ruta | Descripción |
|------|-------------|
| `/ptar` | Planta de tratamiento |

**Roles con acceso**: `admin`, `ejecutivo`, `water`, `ptar`, `user` — ❌ NO `datos`, NO `gas`

---

### Análisis (cualquier usuario autenticado)
| Ruta | Descripción |
|------|-------------|
| `/analisis` | Centro de análisis |
| `/predicciones` | Predicciones |
| `/alertas` | Alertas |

**Roles con acceso**: todos los autenticados (guard: `ProtectedRoute`)

> Nota: El sidebar filtra estas opciones según rol, pero la ruta en sí no bloquea.

---

### Ingreso de Datos (`DataRoute` — admin, datos, water)
| Ruta | Descripción |
|------|-------------|
| `/agregar-lecturas` | Lecturas semanales agua |
| `/editar-lecturas` | Editar lecturas semanales agua |
| `/agregar-lecturas-mensuales-agua` | Lecturas mensuales agua |
| `/editar-lecturas-mensuales-agua` | Editar lecturas mensuales agua |
| `/agregar-lecturas-diarias` | Lecturas diarias agua |
| `/editar-lecturas-diarias` | Editar lecturas diarias agua |
| `/agregar-lecturas-gas` | Lecturas semanales gas |
| `/editar-lecturas-gas` | Editar lecturas semanales gas |
| `/agregar-lecturas-mensuales-gas` | Lecturas mensuales gas |
| `/editar-lecturas-mensuales-gas` | Editar lecturas mensuales gas |
| `/agregar-lecturas-ptar` | Lecturas PTAR |
| `/editar-lecturas-ptar` | Editar lecturas PTAR |
| `/agregar-datos` | Agregar datos general |

**Roles con acceso**: `admin`, `datos`, `water`

---

### Importación Excel/SQL (`DataRoute` — admin, datos, water)
| Ruta | Descripción |
|------|-------------|
| `/excel-to-sql` | Pantalla principal de importación |
| `/excel-to-sql/agua/2023` | Agua semanal 2023 |
| `/excel-to-sql/agua/2024` | Agua semanal 2024 |
| `/excel-to-sql/agua/2025` | Agua semanal 2025 |
| `/excel-to-sql/gas/2023` | Gas semanal 2023 |
| `/excel-to-sql/gas/2024` | Gas semanal 2024 |
| `/excel-to-sql/gas/2025` | Gas semanal 2025 |
| `/excel-to-sql/gas/2025/comedor-tec-food` | Gas comedor Tec Food |
| `/excel-to-sql/ptar` | PTAR |
| `/excel-to-sql/agua-mensual` | Agua mensual |
| `/csv-to-sql-daily` | CSV lecturas diarias |

**Roles con acceso**: `admin`, `datos`, `water`

---

### Administración (solo admin)
| Ruta | Guard | Descripción |
|------|-------|-------------|
| `/correos` | `AdminRoute` | Gestión de correos |

---

## 🧩 Guards de Ruta

| Guard | Archivo | Lógica |
|-------|---------|--------|
| `ProtectedRoute` | `src/components/ProtectedRouteNew.jsx` | Solo requiere sesión activa |
| `PermissionRoute` | `src/components/PermissionRoute.jsx` | Evalúa `can(permission)` via `usePermissions` |
| `DataRoute` | `src/components/DataRouteNew.jsx` | Permite roles `admin`, `datos`, `water` |
| `AdminRoute` | `src/components/AdminRouteNew.jsx` | Solo rol `admin` |

---

## 🔧 Uso en Código

### Hook `usePermissions`

```javascript
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { can, canViewWater, canViewGas, role } = usePermissions();

  return (
    <div>
      <p>Tu rol: {role}</p>
      {canViewWater && <WaterSection />}
      {canViewGas && <GasSection />}
      {can('addData') && <AddDataButton />}
    </div>
  );
}
```

### Componente `PermissionRoute`

```javascript
<Route
  path="/consumo"
  element={
    <PermissionRoute permission="water">
      <ConsumptionPage />
    </PermissionRoute>
  }
/>
```

### Verificación Manual

```javascript
import { hasPermission } from '../config/permissions';

hasPermission('datos', 'addData');   // true
hasPermission('datos', 'ptar');      // false
hasPermission('water', 'dashboard'); // false
```

---

## 🔄 Gestión de Usuarios en Base de Datos

```sql
-- Ver roles actuales
SELECT id, email, role FROM profiles;

-- Cambiar rol
UPDATE profiles
SET role = 'datos'  -- 'admin' | 'ejecutivo' | 'datos' | 'water' | 'gas' | 'ptar' | 'user'
WHERE email = 'usuario@ejemplo.com';
```

> Los roles se normalizan a minúsculas automáticamente en `AuthContextNew.jsx`.

---

## 📝 Modificar Permisos

Editar `src/config/permissions.js`:

```javascript
datos: {
  water: true,
  gas: true,
  ptar: false,   // ← cambiar a true para dar acceso a PTAR
  addData: true,
  // ...
}
```

---

## ✅ Estado del Sistema

- [x] 7 roles configurados (`admin`, `ejecutivo`, `datos`, `water`, `gas`, `ptar`, `user`)
- [x] Matriz de permisos en `src/config/permissions.js`
- [x] Hook `usePermissions` — `src/hooks/usePermissions.js`
- [x] Guards de ruta: `ProtectedRoute`, `PermissionRoute`, `DataRoute`, `AdminRoute`
- [x] Normalización de roles a minúsculas (case-insensitive)
- [x] Sidebar filtra secciones e ítems según rol
- [x] Todas las rutas de ingreso de datos accesibles para rol `datos`
