import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import AquaNetLogo from "../components/svg/AquaNetLogo"
import AquaNetText from "../components/svg/AquaNetText"
import { 
  Droplets, 
  BarChart3, 
  Shield, 
  Zap, 
  Target, 
  ArrowRight,
  CheckCircle,
  Waves,
  Users,
  Globe,
  Star,
  Play,
  Menu,
  X,
  TrendingUp,
  Flame
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import ComplexWaterBackground from '../components/WaterBackground'
import Braveform from '../components/BrevoForm'

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const benefits = [
    {
      icon: <Droplets className="w-12 h-12 text-cyan-400" />,
      title: "Control de consumo de recursos en tiempo real",
      description: "Conoce en tiempo real cuánta agua consumes, dónde se desperdicia y cómo puedes optimizar cada litro. Monitoreo continuo de 100+ puntos de consumo con alertas inteligentes.",
      iconVisual: <Droplets className="w-16 h-16 text-cyan-400" />,
      position: "left"
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-blue-400" />,
      title: "Decisiones basadas en datos",
      description: "Accede a reportes inteligentes y dashboards intuitivos que facilitan la planeación, cumplimiento regulatorio y la sostenibilidad empresarial. Visualizaciones interactivas y análisis predictivo.",
      iconVisual: <BarChart3 className="w-16 h-16 text-blue-400" />,
      position: "right"
    },
    {
      icon: <Zap className="w-12 h-12 text-cyan-400" />,
      title: "Tecnología con sensores e IA",
      description: "Integramos sensores, analítica avanzada e inteligencia artificial para garantizar información precisa y soluciones adaptadas a tu operación. Predicciones con machine learning.",
      iconVisual: <Zap className="w-16 h-16 text-cyan-400" />,
      position: "left"
    }
  ];

  const features = [
    { icon: <Droplets className="w-6 h-6" />, text: "Monitoreo en tiempo real" },
    { icon: <BarChart3 className="w-6 h-6" />, text: "Análisis predictivo con IA" },
    { icon: <Shield className="w-6 h-6" />, text: "Cumplimiento regulatorio" },
    { icon: <Zap className="w-6 h-6" />, text: "Identificación de fugas" },
  ];

  const mainServices = [
    {
      icon: <Droplets className="w-12 h-12" />,
      title: "Agua",
      description: "Monitoreo y optimización del consumo de agua en tiempo real con análisis predictivo."
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Electricidad",
      description: "Gestión inteligente de energía eléctrica para reducir costos y mejorar la eficiencia operativa."
    },
    {
      icon: <Flame className="w-12 h-12" />,
      title: "Gas",
      description: "Control y seguimiento del consumo de gas con alertas automáticas y reportes detallados."
    }
  ];

  const handleContactRedirect = () => {
    window.location.href = '/#contact';
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDashboardRedirect = () => {
    console.log('Redirigiendo al dashboard...');
    setIsNavigating(true);
    
    try {
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al navegar al dashboard:', error);
      setIsNavigating(false);
      // Fallback: redirección manual
      window.location.href = '/dashboard';
    }
    
    // Resetear el estado después de un tiempo
    setTimeout(() => {
      setIsNavigating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-[#0A1628]/95 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <AquaNetLogo className="w-8 h-8" />
              <AquaNetText className="w-32 h-8" />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors">Características</a>
              <a href="#about" className="text-gray-300 hover:text-cyan-400 transition-colors">Nosotros</a>
             
              <Button 
                onClick={handleContactRedirect}
                variant="outline"
                size="sm"
                className="border-cyan-400/50 text-white hover:text-cyan-400 hover:bg-cyan-500/10"
              >
                Contacto
              </Button>

              <Button 
                onClick={handleLogin}
                variant="default"
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Iniciar sesión
              </Button>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4 bg-[#0A1628]">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors">Características</a>
                <a href="#about" className="text-gray-300 hover:text-cyan-400 transition-colors">Nosotros</a>
                <a href="#contact" className="text-gray-300 hover:text-cyan-400 transition-colors">Contacto</a>
                <Button 
                  onClick={handleContactRedirect}
                  variant="outline"
                  size="sm"
                  className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-500/10 w-fit"
                >
                  Contacto
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#1A2F5A] to-[#0F1B35] min-h-screen flex items-center">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium mb-8"
            >
              <Zap className="w-4 h-4" />
              Inteligencia en Gestión de Recursos
            </motion.div>
            
            {/* Main Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              <span className="text-white">Bluemetrics: La </span>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Inteligencia Hídrica y Energética
              </span>
              <span className="text-white"> que su Operación Necesita</span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-300 mb-6 max-w-4xl mx-auto leading-relaxed"
            >
              Monitoreo en tiempo real, predicciones con IA y optimización de 100+ puntos de consumo. Transforme sus datos en ahorros y sostenibilidad.
            </motion.p>

            {/* Target Audience */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-base sm:text-lg text-cyan-400 font-medium mb-10"
            >
              Diseñado para instalaciones de alto consumo: Campus, Hospitales e Industria
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                onClick={handleContactRedirect}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all duration-300 group flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Agende una Demostración
              </Button>
              <Button 
                onClick={() => {
                  console.log('Botón Ver Caso de Estudio clickeado');
                  handleDashboardRedirect();
                }}
                variant="outline"
                size="lg"
                disabled={isNavigating}
                className="border-2 border-blue-400/50 text-white hover:text-cyan-400 hover:bg-blue-500/20 px-8 py-6 text-lg rounded-xl backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
              >
                {isNavigating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Cargando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Ver Caso de Estudio
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-cyan-400 mb-3 flex justify-center">{feature.icon}</div>
                <span className="text-white text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section - Zigzag Layout */}
      <section id="features" className="py-20 bg-gradient-to-b from-[#0F1B35] to-[#1A2F5A] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Características <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Principales</span>
            </h2>
            <p className="text-xl text-cyan-200">Descubre cómo Bluemetrics transforma la gestión de tus recursos</p>
          </motion.div>

          {benefits.map((benefit, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`mb-20 ${index === benefits.length - 1 ? 'mb-0' : ''}`}
            >
              <div className={`grid lg:grid-cols-2 gap-12 items-center ${benefit.position === 'right' ? 'lg:grid-flow-col-dense' : ''}`}>
                {/* Content */}
                <div className={`${benefit.position === 'right' ? 'lg:col-start-2' : ''}`}>
                  <motion.div 
                    initial={{ opacity: 0, x: benefit.position === 'right' ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-6"
                  >
                    {benefit.icon}
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0, x: benefit.position === 'right' ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-3xl lg:text-4xl font-bold text-white mb-6"
                  >
                    {benefit.title}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, x: benefit.position === 'right' ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-xl text-gray-300 leading-relaxed mb-8"
                  >
                    {benefit.description}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, x: benefit.position === 'right' ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Button 
                      onClick={handleContactRedirect}
                      variant="outline" 
                      className="border-cyan-400 text-white hover:text-cyan-400 hover:bg-cyan-500/10 backdrop-blur-sm"
                    >
                      Conoce más
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </div>

                {/* Visual */}
                <div className={`${benefit.position === 'right' ? 'lg:col-start-1' : ''}`}>
                  <motion.div 
                    initial={{ opacity: 0, x: benefit.position === 'right' ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 text-center">
                      <div className="flex justify-center mb-6">{benefit.iconVisual}</div>
                      <div className="bg-[#0A1628]/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/10">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-cyan-400">
                              {index === 0 ? '100+' : index === 1 ? '30%' : '99.9%'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {index === 0 ? 'Puntos' : index === 1 ? 'Ahorro' : 'Precisión'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {index === 0 ? '24/7' : index === 1 ? '5min' : 'IA'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {index === 0 ? 'Monitoreo' : index === 1 ? 'Reportes' : 'Predicciones'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Services Section - Nuestros principales giros */}
      <section className="py-20 bg-gradient-to-b from-[#1A2F5A] to-[#0F1B35] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Nuestros principales <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">giros</span>
            </h2>
            <p className="text-xl text-cyan-200">Soluciones integrales para la gestión de recursos</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {mainServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-[#0A1628] to-[#1A2F5A] border-4 border-cyan-500/30 rounded-2xl m-8 p-8 text-center hover:border-cyan-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 h-full flex flex-col">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center border-2 border-cyan-400/30">
                      <div className="text-cyan-400">
                        {service.icon}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                  
                  <p className="text-gray-300 leading-relaxed flex-grow">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-gradient-to-b from-[#0F1B35] to-[#0A1628] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-white mb-8"
          >
            Quiénes <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">somos</span>
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6 text-lg text-gray-300 leading-relaxed"
          >
            <p>
              En BlueMetrics creemos que los recursos son el activo más valioso de cualquier operación. 
              Por eso desarrollamos una plataforma digital que ayuda a empresas, instituciones y 
              comunidades a medir, analizar y optimizar el uso de agua, electricidad y gas de manera inteligente.
            </p>
            
            <p>
              Nuestra misión es asegurar la sostenibilidad operativa a través de la innovación 
              tecnológica. Integramos datos en tiempo real, modelos predictivos y herramientas 
              de fácil uso que impulsan la toma de decisiones responsables y eficientes.
            </p>
            
            <p>
              Somos un equipo comprometido en generar impacto positivo: económico, social y 
              ambiental. Con BlueMetrics, transformamos la gestión de recursos en una ventaja 
              competitiva y un paso firme hacia el futuro.
            </p>
          </motion.div>

          {/* Team Values */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              { icon: Users, title: "Equipo Experto", description: "Profesionales especializados en gestión de recursos", color: "blue" },
              { icon: Globe, title: "Impacto Global", description: "Soluciones que trascienden fronteras", color: "blue" },
              { icon: Star, title: "Innovación", description: "Tecnología de vanguardia para el futuro", color: "blue" }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="text-center "
              >
                <div className={`w-16 h-16 bg-${value.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <value.icon className={`w-8 h-8 text-${value.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-white">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative bg-gradient-to-br from-[#0A1628] via-[#1A2F5A] to-[#0F1B35] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed" 
          style={{
            backgroundImage: 'url(/foto1.png)',
            backgroundAttachment: 'fixed'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20"></div>
        {/* Gradient Orbs */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">Resultados</span> que hablan por sí solos
            </h2>
            <p className="text-cyan-200 text-lg">
              Instituciones confían en BlueMetrics para transformar su gestión de recursos
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: "100+", label: "Puntos de Consumo" },
              { value: "99.9%", label: "Tiempo de Actividad" },
              { value: "30%", label: "Ahorro en Costos" },
              { value: "24/7", label: "Monitoreo Continuo" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-[#0F1B35] to-[#1A2F5A] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-white mb-6"
          >
            ¿Listo para transformar tu <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">gestión de recursos</span>?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-300 mb-10"
          >
            Únete a las instituciones que ya confían en BlueMetrics para optimizar 
            sus recursos, construyendo un futuro sostenible.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              onClick={handleContactRedirect}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 text-lg"
            >
              Contáctanos
            </Button>
            <Button 
              onClick={handleContactRedirect}
              variant="outline"
              size="lg"
              className="border-cyan-400 text-white hover:text-cyan-400 hover:bg-cyan-500/10 backdrop-blur-sm px-10 py-4 text-lg"
            >
              Más información
            </Button>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-sm text-gray-400 mt-6 flex items-center justify-center gap-4 flex-wrap"
          >
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> Sin compromiso</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Configuración en 24 horas</span>
            <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" /> Soporte especializado</span>
          </motion.p>
        </div>
      </section>

      {/* Contact Section with Form */}
      <section id="contact" className="py-20 bg-gradient-to-b from-[#1A2F5A] to-[#0F1B35] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {/* Icon header */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full mb-6 shadow-lg"
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl lg:text-5xl font-bold text-white mb-6"
            >
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Contáctanos
              </span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              ¿Tienes preguntas? Nos encantaría ayudarte a encontrar la solución perfecta para tu institución.
              <span className="block mt-2 text-lg text-cyan-400">
                Transforma tu gestión de recursos con tecnología inteligente.
              </span>
            </motion.p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              {/* Decorative gradient border */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 rounded-2xl blur opacity-50"></div>
              <div className="relative bg-[#0A1628] border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden">
                <Braveform />
              </div>
            </div>
            
            {/* Features below form */}
            <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
              {[
                { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Respuesta Rápida", description: "Te contactamos en menos de 24 horas" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", title: "Sin Compromiso", description: "Demo gratuita sin obligaciones" },
                { icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z", title: "Soporte Especializado", description: "Equipo experto en gestión energética" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="bg-[#0A1628]/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-cyan-500/20">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-[#0A1628] to-[#050A14] text-white py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <AquaNetLogo className="w-8 h-8 mr-3" />
                <AquaNetText className="w-32 h-6" />
              </div>
              <p className="text-gray-400 max-w-md mb-6">
                Innovación y datos para un futuro con recursos. Transformamos la gestión de tus recursos
                a través de tecnología inteligente y soluciones sostenibles.
              </p>
                <div className="flex space-x-4">
                  <Button 
                    variant="social"
                    size="sm"
                    href="https://www.linkedin.com/company/bluemetrics-gestion-h%C3%ADdrica/posts/?feedView=all"
                    target="_blank"
                    title="Síguenos en LinkedIn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </Button>
                  
                  <Button 
                    variant="social"
                    size="sm"
                    href="https://www.facebook.com/people/BlueMetrics/61581174772648/"
                    target="_blank"
                    title="Síguenos en Facebook"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </Button>
                  
                  <Button 
                    variant="social"
                    size="sm"
                    href="https://www.instagram.com/blue_metrics_ai/?igsh=MWg1YzVtY2Y2OGkyOQ%3D%3D#"
                    target="_blank"
                    title="Síguenos en Instagram"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-12.013C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </Button>
                </div>
            </div>
            
            <div>
              <h3 className="font-semibold  mb-6">Plataforma</h3>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={handleContactRedirect} className="hover:text-cyan-400 transition-colors">Dashboard</button></li>
                <li><button onClick={handleContactRedirect} className="hover:text-cyan-400 transition-colors">Pozos</button></li>
                <li><button onClick={handleContactRedirect} className="hover:text-cyan-400 transition-colors">Consumo</button></li>
                <li><button onClick={handleContactRedirect} className="hover:text-cyan-400 transition-colors">Balance Hídrico</button></li>
                <li><button onClick={handleContactRedirect} className="hover:text-cyan-400 transition-colors">Consulta</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6">Información</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-cyan-400 transition-colors">contacto@bluemetrics.mx</li>
                <li className="hover:text-cyan-400 transition-colors">+52 844 544 7606</li>
                <li className="hover:text-cyan-400 transition-colors">Soporte 24/7</li>
                <li>
                  <Button 
                    onClick={handleContactRedirect}
                    size="sm"
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white mt-2"
                  >
                    Contáctanos
                  </Button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 BlueMetrics. Todos los derechos reservados.
              </p>
              <p className="text-gray-500 text-sm mt-2 md:mt-0">
                Innovación y datos para un futuro con recursos.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;