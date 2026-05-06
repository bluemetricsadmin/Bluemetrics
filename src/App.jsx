import { Routes, Route } from 'react-router'
import { AuthProvider } from './contexts/AuthContextNew'
import ProtectedRoute from './components/ProtectedRouteNew'
import AdminRoute from './components/AdminRouteNew'
import DataRoute from './components/DataRouteNew'
import PermissionRoute from './components/PermissionRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPageNew'
import DashboardPage from './pages/DashboardPage'
import ConsumptionPage from './pages/ConsumptionPage'
import WaterBalancePage from './pages/WaterBalancePage'
import WellsPage from './pages/WellsPage'
import WellDetailPage from './pages/WellDetailPage'
import PTARPage from './pages/PTARPage'
import AddDataPage from './pages/AddDataPage'
import AddWeeklyReadingsPage from './pages/AddWeeklyReadingsPage'
import EditWeeklyReadingsPage from './pages/EditWeeklyReadingsPage'
import AddDailyReadingsPage from './pages/AddDailyReadingsPage'
import EditDailyReadingsPage from './pages/EditDailyReadingsPage'
import AddPTARReadingsPage from './pages/AddPTARReadingsPage'
import EditPTARReadingsPage from './pages/EditPTARReadingsPage'
import GasConsumptionPage from './pages/GasConsumptionPage'
import AddWeeklyGasReadingsPage from './pages/AddWeeklyGasReadingsPage'
import EditGasReadingsPage from './pages/EditGasReadingsPage'
import AlertsPage from './pages/AlertsPage'
import PredictionsPage from './pages/PredictionsPage'
import ContactPage from './pages/ContactPage'
import ConfirmationPage from './pages/ConfirmationPage'
import CorreosPage from './pages/CorreosPage'
import ExcelToSqlPage from './pages/ExcelToSqlPage'
import CsvToSqlDailyPage from './pages/CsvToSqlDailyPage'

// Excel to SQL - Agua (diferentes años)
import ExcelToSqlAgua2023 from './pages/ExcelToSql/ExcelToSqlAgua2023'
import ExcelToSqlAgua2024 from './pages/ExcelToSql/ExcelToSqlAgua2024'
import ExcelToSqlAgua2025 from './pages/ExcelToSql/ExcelToSqlAgua2025'

// Excel to SQL - Gas (diferentes años)
import ExcelToSqlGas2023 from './pages/ExcelToSql/ExcelToSqlGas2023'
import ExcelToSqlGas2024 from './pages/ExcelToSql/ExcelToSqlGas2024'
import ExcelToSqlGas2025 from './pages/ExcelToSql/ExcelToSqlGas2025'
import GasComedorTecFoodPage from './pages/GasComedorTecFoodPage'

// Excel to SQL - PTAR
import ExcelToSqlPTAR from './pages/ExcelToSql/ExcelToSqlPTAR'

import DailyReadingsPage from './pages/DailyReadingsPage'
import AnalysisSectionPage from './pages/AnalysisSectionPage'
import ErrorPage from './pages/ErrorPage'

// Lecturas Mensuales de Agua
import MonthlyWaterConsumptionPage from './pages/MonthlyWaterConsumptionPage'
import AddMonthlyWaterReadingsPage from './pages/AddMonthlyWaterReadingsPage'
import EditMonthlyWaterReadingsPage from './pages/EditMonthlyWaterReadingsPage'
import ExcelToSqlMonthlyWater from './pages/ExcelToSql/ExcelToSqlMonthlyWater'

//Lecturas Mensuales de Gas
import GasComsumptionMonthlyPage  from './pages/GasComsuptionMontlyPage' 
import EditMonthlyGasReadingsPage from './pages/EditMonthlyGasReadingsPage'
import AddMonthlyGasReadingsPage from './pages/AddMonthlyGasReadingsPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/confirmacion" element={<ConfirmationPage />} />

        {/* Dashboard - requiere permiso dashboard */}
        <Route path="/dashboard" element={<PermissionRoute permission="dashboard"><DashboardPage /></PermissionRoute>} />
        
        {/* Rutas de AGUA - requieren permiso 'water' */}
        <Route path="/consumo" element={<PermissionRoute permission="water"><ConsumptionPage /></PermissionRoute>} />
        <Route path="/pozos" element={<PermissionRoute permission="water"><WellsPage /></PermissionRoute>} />
        <Route path="/pozos/:id" element={<PermissionRoute permission="water"><WellDetailPage /></PermissionRoute>} />
        <Route path="/lecturas-diarias" element={<PermissionRoute permission="water"><DailyReadingsPage /></PermissionRoute>} />
        
        {/* Balance hídrico - requiere permiso especial (no para water) */}
        <Route path="/balance" element={<PermissionRoute permission="dashboard"><WaterBalancePage /></PermissionRoute>} />
        
        {/* Rutas de GAS - requieren permiso 'gas' */}
        <Route path="/consumo-gas" element={<PermissionRoute permission="gas"><GasConsumptionPage /></PermissionRoute>} />
        <Route path="/consumo-mensual-gas" element={<PermissionRoute permission="gas"><GasComsumptionMonthlyPage /></PermissionRoute>} />
        <Route path="/agregar-lecturas-mensuales-gas" element={<PermissionRoute permission="gas"><AddMonthlyGasReadingsPage /></PermissionRoute>} />
        <Route path="/editar-lecturas-mensuales-gas" element={<PermissionRoute permission="gas"><EditMonthlyGasReadingsPage /></PermissionRoute>} />

        {/* Rutas de PTAR - requieren permiso 'ptar' */}
        <Route path="/ptar" element={<PermissionRoute permission="ptar"><PTARPage /></PermissionRoute>} />
        
        {/* Rutas generales - todos los autenticados */}
        <Route path="/alertas" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/predicciones" element={<ProtectedRoute><PredictionsPage /></ProtectedRoute>} />
        <Route path="/analisis" element={<ProtectedRoute><AnalysisSectionPage /></ProtectedRoute>} />

        {/* Rutas de ingreso de datos - accesibles para roles admin y datos */}
        <Route path="/agregar-datos" element={<DataRoute><AddDataPage /></DataRoute>} />
        <Route path="/agregar-lecturas" element={<DataRoute><AddWeeklyReadingsPage /></DataRoute>} />
        <Route path="/editar-lecturas" element={<DataRoute><EditWeeklyReadingsPage /></DataRoute>} />
        <Route path="/agregar-lecturas-diarias" element={<DataRoute><AddDailyReadingsPage /></DataRoute>} />
        <Route path="/editar-lecturas-diarias" element={<DataRoute><EditDailyReadingsPage /></DataRoute>} />
        <Route path="/agregar-lecturas-gas" element={<DataRoute><AddWeeklyGasReadingsPage /></DataRoute>} />
        <Route path="/editar-lecturas-gas" element={<DataRoute><EditGasReadingsPage /></DataRoute>} />
        <Route path="/agregar-lecturas-ptar" element={<DataRoute><AddPTARReadingsPage /></DataRoute>} />
        <Route path="/editar-lecturas-ptar" element={<DataRoute><EditPTARReadingsPage /></DataRoute>} />
        
        {/* Rutas de Lecturas Mensuales de Agua */}
        <Route path="/consumo-mensual-agua" element={<PermissionRoute permission="water"><MonthlyWaterConsumptionPage /></PermissionRoute>} />
        <Route path="/agregar-lecturas-mensuales-agua" element={<DataRoute><AddMonthlyWaterReadingsPage /></DataRoute>} />
        <Route path="/editar-lecturas-mensuales-agua" element={<DataRoute><EditMonthlyWaterReadingsPage /></DataRoute>} />
        
        <Route path="/excel-to-sql" element={<DataRoute><ExcelToSqlPage /></DataRoute>} />
        <Route path="/excel-to-sql/agua/2023" element={<DataRoute><ExcelToSqlAgua2023 /></DataRoute>} />
        <Route path="/excel-to-sql/agua/2024" element={<DataRoute><ExcelToSqlAgua2024 /></DataRoute>} />
        <Route path="/excel-to-sql/agua/2025" element={<DataRoute><ExcelToSqlAgua2025 /></DataRoute>} />
        <Route path="/excel-to-sql/gas/2023" element={<DataRoute><ExcelToSqlGas2023 /></DataRoute>} />
        <Route path="/excel-to-sql/gas/2024" element={<DataRoute><ExcelToSqlGas2024 /></DataRoute>} />
        <Route path="/excel-to-sql/gas/2025" element={<DataRoute><ExcelToSqlGas2025 /></DataRoute>} />
        <Route path="/excel-to-sql/gas/2025/comedor-tec-food" element={<DataRoute><GasComedorTecFoodPage /></DataRoute>} />
        <Route path="/excel-to-sql/ptar" element={<DataRoute><ExcelToSqlPTAR /></DataRoute>} />
        <Route path="/excel-to-sql/agua-mensual" element={<DataRoute><ExcelToSqlMonthlyWater /></DataRoute>} />
        <Route path="/csv-to-sql-daily" element={<DataRoute><CsvToSqlDailyPage /></DataRoute>} />

        {/* Rutas exclusivas de admin - solo rol admin */}
        <Route path="/correos" element={<AdminRoute><CorreosPage /></AdminRoute>} />
        
        {/* Ruta 404 - debe estar al final */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App
