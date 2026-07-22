import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import AquaNetLogo from '../components/svg/AquaNetLogo';
import AquaNetText from '../components/svg/AquaNetText';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextNew';
import { usePermissions } from '../hooks/usePermissions';

const LoginPage = () => {
  const { login, isAuthenticated, loading, user } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    company: '',
    role: 'water',
  });

  // Función para obtener la primera ruta permitida según el rol
  const getDefaultRoute = () => {
    // Si el usuario tiene rol "datos", redirigir directamente a lecturas semanales
    if (user?.role === 'datos') return '/agregar-lecturas';
    
    // Para otros roles, usar el sistema de permisos existente
    //if (can('dashboard')) return '/dashboard';
    if (can('water')) return '/consumo';
    if (can('gas')) return '/consumo-gas';
    if (can('ptar')) return '/ptar';
    return '/';
  };

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getDefaultRoute());
    }
  }, [isAuthenticated, loading, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      // Redirigir a la primera ruta permitida
      navigate(getDefaultRoute());
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { supabase } = await import('../supabaseClient');
      
      // Crear usuario en auth.users con metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            username: registerData.username,
            full_name: registerData.full_name,
            company: registerData.company,
            role: registerData.role.toLowerCase(),
          },
          emailRedirectTo: window.location.origin,
        }
      });

      if (authError) {
        console.error('Error en signUp:', authError);
        throw authError;
      }

      // Verificar si el usuario ya existe
      if (authData?.user && authData.user.identities?.length === 0) {
        setError('Este correo ya está registrado. Por favor inicia sesión.');
        setIsRegisterMode(false);
        setEmail(registerData.email);
        return;
      }

      if (authData?.user) {
        console.log('Usuario creado en auth:', authData.user.id);
        
        // Esperar un momento para que el trigger cree el perfil
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Actualizar el perfil con los datos completos
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: registerData.username,
            full_name: registerData.full_name,
            company: registerData.company,
            role: registerData.role.toLowerCase(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error actualizando perfil:', updateError);
        }

        alert('✅ Cuenta creada exitosamente!\n\nPuedes iniciar sesión ahora con tu email y contraseña.');
        setIsRegisterMode(false);
        setEmail(registerData.email);
        setPassword('');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-35 h-20 rounded-full flex items-center justify-center mb-4">
            <AquaNetLogo className="w-20 h-20" />
          </div>
          <div className='flex items-center justify-center'>
            <AquaNetText className="w-44 h-12" />
          </div>
          <p className="text-gray-600">Sistema de Gestión Hídrica</p>
        </div>

        {isRegisterMode ? (
          // FORMULARIO DE REGISTRO
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
              <input
                type="text"
                value={registerData.full_name}
                onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
              <input
                type="text"
                value={registerData.company}
                onChange={(e) => setRegisterData({...registerData, company: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <select
                value={registerData.role}
                onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="water">Water (Agua)</option>
                <option value="gas">Gas</option>
                <option value="ptar">PTAR</option>
                <option value="user">User (Lectura)</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>

            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className="w-full text-sm text-blue-600 hover:text-blue-700"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </form>
        ) : (
          // FORMULARIO DE LOGIN
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar Sesión
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>


          {/*             
            <button
            type="button"
            onClick={() => setIsRegisterMode(true)}
            className="w-full text-sm text-blue-600 hover:text-blue-700 mt-4"
          >
            ¿No tienes cuenta? Regístrate
          </button>
          */}
        </form>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
