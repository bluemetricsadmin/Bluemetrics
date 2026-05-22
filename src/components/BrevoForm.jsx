import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Mail, User, Phone, Building, ArrowRight, CheckCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../supabaseClient';


const BrevoForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // BREVO DESACTIVADO - Ahora se usa Supabase
  // useEffect(() => {
  //   const link = document.createElement('link');
  //   link.rel = 'stylesheet';
  //   link.href = 'https://sibforms.com/forms/end-form/build/sib-styles.css';
  //   document.head.appendChild(link);
  //   return () => {
  //     document.head.removeChild(link);
  //   };
  // }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Obtener datos del formulario
      const formData = new FormData(e.target);
      const nombre = formData.get('NOMBRE');
      const apellidos = formData.get('APELLIDOS');
      const email = formData.get('EMAIL');
      const telefono = formData.get('TELEFONO');
      const empresa = formData.get('EMPRESA');
      const mensaje = formData.get('MENSAJE');
      
      // Construir el remitente completo
      const remitente = apellidos ? `${nombre} ${apellidos}` : nombre;
      
      // Insertar en Supabase tabla 'correos'
      const { data, error } = await supabase
        .from('correos')
        .insert([
          {
            remitente: remitente,
            email: email,
            telefono: telefono || null,
            empresa: empresa || null,
            asunto: 'Solicitud de demo desde Landing Page',
            mensaje: mensaje || `Solicitud de contacto de ${remitente}`,
            leido: false,
            importante: false,
            categoria: 'consulta'
          }
        ])
        .select();

      if (error) {
        console.error('❌ Error al guardar en Supabase:', error);
        throw error;
      }

      console.log('✅ Correo guardado exitosamente en Supabase:', data);
      
      // Redirigir a la página de confirmación
      navigate('/confirmacion');
      
    } catch (error) {
      console.error('❌ Error al enviar el formulario:', error);
      setIsSubmitting(false);
      
      // Mostrar mensaje de error
      alert('Hubo un problema al enviar el formulario. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Título */}
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-blue-900 mb-3">
              ¡Solicita información ahora!
            </h3>
            <p className="text-blue-700 text-lg leading-relaxed">
              Descubre cómo BlueMetrics puede transformar la gestión de los recursos de tu empresa
            </p>
          </div>
          
          {/* Campos del formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo NOMBRE */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-blue-900" htmlFor="NOMBRE">
                Nombre *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  type="text" 
                  id="NOMBRE" 
                  name="NOMBRE" 
                  autoComplete="off" 
                  placeholder="Tu nombre completo" 
                  required 
                />
              </div>
            </div>

            {/* Campo APELLIDOS */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-blue-900" htmlFor="APELLIDOS">
                Apellidos
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  type="text" 
                  id="APELLIDOS" 
                  name="APELLIDOS" 
                  autoComplete="off" 
                  placeholder="Tus apellidos" 
                />
              </div>
            </div>

            {/* Campo EMAIL */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-blue-900" htmlFor="EMAIL">
                Correo electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  type="email" 
                  id="EMAIL" 
                  name="EMAIL" 
                  autoComplete="off" 
                  placeholder="tu@empresa.com" 
                  required 
                />
              </div>
            </div>

            {/* Campo TELEFONO */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-blue-900" htmlFor="TELEFONO">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  type="tel" 
                  id="TELEFONO" 
                  name="TELEFONO" 
                  autoComplete="off" 
                  placeholder="+52 (844) 5447606" 
                />
              </div>
            </div>

            {/* Campo EMPRESA */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-blue-900" htmlFor="EMPRESA">
                Empresa
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  type="text" 
                  id="EMPRESA" 
                  name="EMPRESA" 
                  autoComplete="off" 
                  placeholder="Nombre de tu empresa" 
                />
              </div>
            </div>

            {/* Campo MENSAJE */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-blue-900" htmlFor="MENSAJE">
                Mensaje
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-blue-400 w-5 h-5" />
                <textarea 
                  className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none"
                  id="MENSAJE" 
                  name="MENSAJE" 
                  autoComplete="off" 
                  placeholder="Cuéntanos sobre tu proyecto..." 
                  rows="4"
                />
              </div>
            </div>
          </div>
          
          {/* Botón de envío */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Enviando solicitud...
                </>
              ) : (
                <>
                  Solicitar información
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BrevoForm;