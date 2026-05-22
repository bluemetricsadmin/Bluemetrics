import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import AquaNetLogo from "../components/svg/AquaNetLogo";
import AquaNetText from "../components/svg/AquaNetText";
import { FaWhatsapp } from "react-icons/fa";
import { 
  CheckCircle,
  ArrowRight,
  Home,
  Mail,
  Clock,
  Phone,
  Sparkles
} from 'lucide-react';

const ConfirmationPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AquaNetLogo className="w-8 h-8" />
              <AquaNetText className="w-32 h-8" />
            </div>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Home className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Icono de éxito con animación */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-2xl">
                <CheckCircle className="w-16 h-16 text-white animate-pulse" />
              </div>
              {/* Efecto de ondas múltiples */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 bg-green-300 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 bg-green-200 rounded-full animate-ping opacity-10" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>

          {/* Título principal */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-blue-900 mb-4">
              ¡Solicitud enviada con éxito!
            </h1>
            <p className="text-xl text-blue-700 leading-relaxed max-w-2xl mx-auto">
              Gracias por tu interés en <span className="font-bold text-blue-600">BlueMetrics</span>. 
              Hemos recibido tu solicitud y estamos emocionados de ayudarte a transformar tu gestión hídrica.
            </p>
          </div>

          {/* Cards de información */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Card principal */}
            <Card className="bg-white shadow-xl border-0">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-900">¿Cuándo te contactaremos?</h3>
                  </div>
                </div>
                <p className="text-blue-700 mb-4">
                  Nuestro equipo revisará tu solicitud y te contactará en las próximas <span className="font-bold">24 horas hábiles</span>.
                </p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">
                    <Mail className="inline w-4 h-4 mr-2" />
                    Revisa tu correo electrónico para más detalles
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card de contacto */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 shadow-xl border-0 text-white">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <FaWhatsapp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">¿Prefieres contactarnos?</h3>
                  </div>
                </div>
                <p className="mb-4 text-blue-100">
                  Si necesitas atención inmediata, no dudes en contactarnos directamente:
                </p>
                <div className="space-y-2">
                  <p className="font-semibold">📧 contacto@bluemetrics.mx</p>
                  <p className="font-semibold">📞 +52 844 544 7606</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Proceso paso a paso */}
          <Card className="bg-white shadow-xl border-0 mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-blue-900 mb-2">¿Qué sigue ahora?</h3>
                <p className="text-blue-600">Nuestro proceso en 4 simples pasos</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Paso 1 */}
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <span className="text-white font-bold text-2xl">1</span>
                    </div>
                    {/* Línea conectora (oculta en mobile) */}
                    <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] w-full h-0.5 bg-gradient-to-r from-blue-400 to-transparent"></div>
                  </div>
                  <h4 className="font-bold text-blue-900 mb-2">Revisión</h4>
                  <p className="text-sm text-blue-600">Analizamos tu solicitud en detalle</p>
                </div>

                {/* Paso 2 */}
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <span className="text-white font-bold text-2xl">2</span>
                    </div>
                    <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] w-full h-0.5 bg-gradient-to-r from-blue-400 to-transparent"></div>
                  </div>
                  <h4 className="font-bold text-blue-900 mb-2">Contacto</h4>
                  <p className="text-sm text-blue-600">Te llamamos en 24 horas</p>
                </div>

                {/* Paso 3 */}
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <span className="text-white font-bold text-2xl">3</span>
                    </div>
                    <div className="hidden md:block absolute top-8 left-[calc(50%+32px)] w-full h-0.5 bg-gradient-to-r from-blue-400 to-transparent"></div>
                  </div>
                  <h4 className="font-bold text-blue-900 mb-2">Demo</h4>
                  <p className="text-sm text-blue-600">Presentación personalizada</p>
                </div>

                {/* Paso 4 */}
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h4 className="font-bold text-blue-900 mb-2">Implementación</h4>
                  <p className="text-sm text-blue-600">¡Comienza tu transformación!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Beneficios destacados */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg mb-8">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-blue-900 mb-6 text-center">
                Lo que obtendrás con BlueMetrics
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-3xl mb-3">📊</div>
                  <h4 className="font-semibold text-blue-900 mb-2">Análisis en tiempo real</h4>
                  <p className="text-sm text-blue-700">Monitoreo constante de tu consumo hídrico</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-3xl mb-3">💰</div>
                  <h4 className="font-semibold text-blue-900 mb-2">Ahorro de costos</h4>
                  <p className="text-sm text-blue-700">Reduce hasta un 30% en gastos de agua</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-3xl mb-3">🌱</div>
                  <h4 className="font-semibold text-blue-900 mb-2">Sostenibilidad</h4>
                  <p className="text-sm text-blue-700">Contribuye al cuidado del medio ambiente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Home className="w-5 h-5 mr-2" />
              Volver al inicio
            </Button>
            <Button 
              onClick={() => navigate('/#contact')}
              variant="outline"
              size="lg"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg"
            >
              <Mail className="w-5 h-5 mr-2" />
              Ver más información
            </Button>
          </div>
        </div>
      </main>

      {/* Footer simple */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            © 2024 BlueMetrics. Todos los derechos reservados. • Innovación y datos para un futuro con agua.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ConfirmationPage;

