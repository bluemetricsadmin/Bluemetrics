import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router'
import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'

export function DashboardHeader() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ name: 'Cargando...', role: '...' })
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error al obtener sesión:', error)
          return
        }

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setUser({
            name: profile?.full_name || session.user.email,
            role: profile?.role || 'user'
          })
        }
      } catch (error) {
        console.error('❌ Error al cargar usuario:', error)
      }
    }

    loadUser()
  }, [])

  const [activeAlertCount, setActiveAlertCount] = useState(0)

  // Fetch alertas activas en tiempo real
  useEffect(() => {
    const fetchActiveCount = async () => {
      const { count, error } = await supabase
        .from('well_events')
        .select('*', { count: 'exact', head: true })
        .in('event_type', ['alerta_consumo', 'sobreconsumo', 'posible_fuga'])
        .eq('event_status', 'activo')
      if (!error) setActiveAlertCount(count || 0)
    }

    fetchActiveCount()

    const channel = supabase
      .channel('header-alert-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'well_events' },
        () => fetchActiveCount()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleAlert = () => {
    navigate('/alertas')
  }
  // Cerrar sesión
  const logout = async () => {
    try {
      setIsLoggingOut(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Error al cerrar sesión:', error)
        throw error
      }

      console.log('✅ Sesión cerrada exitosamente')
      navigate('/')
    } catch (error) {
      console.error('❌ Error inesperado:', error)
      alert('Error al cerrar sesión. Por favor, intenta de nuevo.')
    } finally {
      setIsLoggingOut(false)
    }
  }
  
  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-4 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 w-full lg:w-auto">
          {/* Mensaje de bienvenida */}
          <div className="w-full lg:w-auto">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Bienvenido al Panel de Control</h1>
            <p className="text-sm text-muted-foreground font-medium">Monitoreo y gestión en tiempo real</p>
          </div>
          
          {/* Alertas activas en tiempo real */}
          <button
            onClick={handleAlert}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-muted/60 cursor-pointer"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {activeAlertCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                  {activeAlertCount}
                </span>
                <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-red-500 animate-ping opacity-30"></span>
              </>
            )}
          </button>
        </div>
        
        {/* Estado del sistema y eficiencia */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 w-full lg:w-auto">
         
      
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-3 px-3 lg:px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{user?.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{user?.role === 'admin' ? 'Administrador' : 'Operador'}</div>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              disabled={isLoggingOut}
              className="text-sm px-2 lg:px-3 py-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full lg:w-auto"
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2 flex-shrink-0"></div>
                  <span className="truncate">Cerrando sesión...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  <span className="truncate">Cerrar Sesión</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
