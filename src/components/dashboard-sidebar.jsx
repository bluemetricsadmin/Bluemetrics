import { Button } from "../components/ui/button"
import { useLocation, useNavigate } from "react-router"
import { 
  Mail, Recycle, PlusCircle, Flame, LayoutDashboard, 
  Droplets, Scale, Drill, Database, FileInput, 
  TrendingUp, Bell, ChevronDown, ChevronRight, BarChart3, FileSpreadsheet, Calendar, Upload, Edit
} from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContextNew"

export function DashboardSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    if (user) {
      setUserRole(user.role)
    }
  }, [user])
  
  // Estado para secciones colapsables
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded-sections')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return {
      general: true,
      water: true,
      gas: true,
      data: true,
      analysis: true,
      imports: true,
      admin: true
    }
  })

  useEffect(() => {
    localStorage.setItem('sidebar-expanded-sections', JSON.stringify(expandedSections))
  }, [expandedSections])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // useEffect(() => {
  //   const getUserRole = async () => {
  //     try {
  //       console.log('🔍 [Sidebar] Obteniendo rol del usuario...');
  //       const { data: { session } } = await supabase.auth.getSession()
        
  //       if (session?.user) {
  //         console.log('✅ [Sidebar] Sesión encontrada, consultando profiles...');
          
  //         // GET directo a profiles para obtener el rol
  //         const { data: profile, error } = await supabase
  //           .from('profiles')
  //           .select('role')
  //           .eq('id', session.user.id)
  //           .single()
          
  //         if (error) {
  //           console.error('❌ [Sidebar] Error al obtener rol:', error);
  //           setUserRole('user');
  //         } else {
  //           console.log('✅ [Sidebar] Rol obtenido:', profile?.role);
  //           setUserRole(profile?.role || 'user');
  //         }
  //       }
  //     } catch (error) {
  //       console.error('❌ [Sidebar] Error inesperado:', error)
  //       setUserRole('user')
  //     }
  //   }

  //   getUserRole()
  // }, [])

  // Estructura de menú completa con roles permitidos
  const allMenuSections = [
    {
      id: 'general',
      label: 'General',
      allowedRoles: ['admin', 'datos', 'ejecutivo', 'gas', 'ptar', 'user'],
      items: [
        { id: "dashboard", label: "Dashboard Principal", path: "/dashboard", icon: LayoutDashboard, allowedRoles: ['admin', 'datos', 'ejecutivo', 'water', 'gas', 'ptar', 'user'] }
      ]
    },
    {
      id: 'data',
      label: 'Administración de Datos',
      allowedRoles: ['admin', 'datos'],
      items: [
       { id: "add-readings", label: "Lecturas Semanales Agua", path: "/agregar-lecturas", icon: FileInput, allowedRoles: ['admin', 'datos'] },
        { id: "edit-readings", label: "Editar Lecturas Semanales", path: "/editar-lecturas", icon: Edit, allowedRoles: ['admin', 'datos'] },
        { id: "add-monthly-readings", label: "Lecturas Mensuales Agua", path: "/agregar-lecturas-mensuales-agua", icon: Calendar, allowedRoles: ['admin', 'datos'] },
        { id: "edit-monthly-readings", label: "Editar Lecturas Mensuales Agua", path: "/editar-lecturas-mensuales-agua", icon: Edit, allowedRoles: ['admin', 'datos'] },
        { id: "add-readings-gas", label: "Lecturas Semanales Gas", path: "/agregar-lecturas-gas", icon: FileInput, allowedRoles: ['admin', 'datos'] },
        { id: "edit-readings-gas", label: "Editar Lecturas Semanales de Gas", path: "/editar-lecturas-gas", icon: Edit, allowedRoles: ['admin', 'datos'] },
         { id: "add-monthly-gas-readings", label: "Lecturas Mensuales Gas", path: "/agregar-lecturas-mensuales-gas", icon: Calendar, allowedRoles: ['admin', 'datos'] },
        { id: "edit-monthly-gas-readings", label: "Editar Lecturas Mensuales Gas", path: "/editar-lecturas-mensuales-gas", icon: Edit, allowedRoles: ['admin', 'datos'] },
        { id: "add-daily-readings", label: "Lecturas Diarias Agua", path: "/agregar-lecturas-diarias", icon: Calendar, allowedRoles: ['admin', 'datos'] },
        { id: "edit-daily-readings", label: "Editar Lecturas Diarias", path: "/editar-lecturas-diarias", icon: Edit, allowedRoles: ['admin', 'datos'] },
        { id: "add-ptar-readings", label: "Lecturas PTAR", path: "/agregar-lecturas-ptar", icon: Recycle, allowedRoles: ['admin', 'datos'] },
        { id: "edit-ptar-readings", label: "Editar Lecturas PTAR", path: "/editar-lecturas-ptar", icon: Edit, allowedRoles: ['admin', 'datos'] }
      ]
    },
    {
      id: 'imports',
      label: 'Importación Excel/SQL',
      allowedRoles: ['admin', 'datos'],
      items: [
        { id: "excel-to-sql", label: "Importar Datos", path: "/excel-to-sql", icon: Upload, allowedRoles: ['admin', 'datos'] },
        { id: "excel-agua-2023", label: "Agua 2023", path: "/excel-to-sql/agua/2023", icon: Droplets, allowedRoles: ['admin', 'datos'] },
        { id: "excel-agua-2024", label: "Agua 2024", path: "/excel-to-sql/agua/2024", icon: Droplets, allowedRoles: ['admin', 'datos'] },
        { id: "excel-agua-2025", label: "Agua 2025", path: "/excel-to-sql/agua/2025", icon: Droplets, allowedRoles: ['admin', 'datos'] },
        { id: "excel-gas-2023", label: "Gas 2023", path: "/excel-to-sql/gas/2023", icon: Flame, allowedRoles: ['admin', 'datos'] },
        { id: "excel-gas-2024", label: "Gas 2024", path: "/excel-to-sql/gas/2024", icon: Flame, allowedRoles: ['admin', 'datos'] },
        { id: "excel-gas-2025", label: "Gas 2025", path: "/excel-to-sql/gas/2025", icon: Flame, allowedRoles: ['admin', 'datos'] },
        { id: "excel-agua-mensual", label: "Agua Mensual", path: "/excel-to-sql/agua-mensual", icon: Calendar, allowedRoles: ['admin', 'datos'] }
      ]
    },
    {
      id: 'water',
      label: 'Gestión Hídrica',
      allowedRoles: ['admin', 'ejecutivo', 'water', 'user'],
      items: [
        { id: "wells", label: "Pozos", path: "/pozos", icon: Drill, allowedRoles: ['admin', 'ejecutivo', 'water', 'user'] },
        { id: "consumption", label: "Consumo Semanal Agua", path: "/consumo", icon: Droplets, allowedRoles: ['admin', 'ejecutivo', 'water', 'user'] },
        { id: "monthly-consumption", label: "Consumo Mensual Agua", path: "/consumo-mensual-agua", icon: Calendar, allowedRoles: ['admin', 'ejecutivo', 'water', 'user'] },
        { id: "daily-readings", label: "Lecturas Diarias", path: "/lecturas-diarias", icon: Calendar, allowedRoles: ['admin', 'ejecutivo', 'water', 'user'] },
        //{ id: "ptar", label: "PTAR", path: "/ptar", icon: Recycle, allowedRoles: ['admin', 'ejecutivo', 'ptar', 'user'] },
        //{ id: "balance", label: "Balance Hídrico", path: "/balance", icon: Scale, allowedRoles: ['admin', 'ejecutivo', 'user'] }
      ]
    },
    {
      id: 'gas',
      label: 'Gestión de Gas',
      allowedRoles: ['admin', 'ejecutivo','water','gas', 'user'],
      items: [
        { id: "gas-consumption", label: "Consumo Semanal de Gas", path: "/consumo-gas", icon: Flame, allowedRoles: ['admin', 'ejecutivo', 'water', 'gas', 'user'] },
        { id: "gas-consumption-monthly", label: "Consumo Mensual de Gas", path: "/consumo-mensual-gas", icon: Flame, allowedRoles: ['admin', 'ejecutivo','gas','water'] }
      
      ]
    },
    {
      id: 'analysis',
      label: 'Análisis',
      allowedRoles: ['admin', 'ejecutivo', 'gas', 'ptar', 'user'],
      items: [
        /*{ id: "analysis-section", label: "Centro de Análisis", path: "/analisis", icon: BarChart3, allowedRoles: ['admin', 'ejecutivo', 'water', 'gas', 'ptar', 'user'] },
        { id: "predictions", label: "Predicciones", path: "/predicciones", icon: TrendingUp, allowedRoles: ['admin', 'ejecutivo', 'water', 'gas', 'user'] },*/
        { id: "alerts", label: "Alertas", path: "/alertas", icon: Bell, allowedRoles: ['admin', 'ejecutivo', 'water', 'gas', 'ptar', 'user'] }
      ]
    },
  ]

  // Filtrar menú según rol del usuario
  const menuSections = allMenuSections
    .filter(section => {
      // Si no hay rol, mostrar solo secciones accesibles para 'user'
      const currentRole = userRole || 'user'
      return section.allowedRoles.includes(currentRole)
    })
    .map(section => ({
      ...section,
      // Filtrar items dentro de cada sección
      items: section.items.filter(item => {
        const currentRole = userRole || 'user'
        return item.allowedRoles.includes(currentRole)
      })
    }))
    .filter(section => section.items.length > 0) // Eliminar secciones sin items

  const handleNavigation = (path) => {
    navigate(path)
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50">
      {/* Logo de la empresa */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold text-sidebar-foreground tracking-wide">
            BlueMetrics
          </h1>
        </div>
      </div>

      {/* Menú de navegación */}
      <div className="p-4 overflow-y-auto h-[calc(100vh-80px)] scrollbar-hide">
        <nav className="space-y-4">
          {menuSections.map((section) => (
            <div key={section.id} className="space-y-1">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors uppercase tracking-wider"
              >
                <span>{section.label}</span>
                {expandedSections[section.id] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Section Items */}
              {expandedSections[section.id] && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={`w-full justify-start ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                        onClick={() => handleNavigation(item.path)}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                        {item.badge && (
                          <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
