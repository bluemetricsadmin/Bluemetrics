import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BrevoForm from '../components/BrevoForm';
import LogoBlueMetrics from '../assets/BlueMetrics.png';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const ContactPage = () => {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const formRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      gsap.fromTo(formRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 }
      );

      gsap.fromTo(infoRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.5 }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1623] via-[#08375F] to-[#0B1623] font-['Inter',sans-serif]">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1FB6C9]/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#0A4C8A]/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#2EE6FF]/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header ref={headerRef} className="relative z-10 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <img
            src={LogoBlueMetrics}
            alt="BlueMetrics MX"
            className="h-10 w-auto object-contain cursor-pointer"
            onClick={() => navigate('/')}
          />
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Volver al inicio</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Form Section */}
          <div ref={formRef} className="order-2 lg:order-1">
            <div className="p-8 sm:p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <BrevoForm />
            </div>
          </div>

          {/* Info Section */}
          <div ref={infoRef} className="order-1 lg:order-2 space-y-8">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Hablemos de tu <span className="text-[#2EE6FF]">transformación digital</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/70 leading-relaxed">
                Nuestro equipo está listo para ayudarte a optimizar la gestión de recursos de tu empresa. 
                Completa el formulario y te contactaremos en menos de 24 horas.
              </p>
            </div>

            {/* Contact Info Cards */}
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1FB6C9]/10 to-transparent border border-white/10 hover:border-[#1FB6C9]/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1FB6C9]/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-[#1FB6C9]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Email</h3>
                    <p className="text-white/60">contacto@bluemetrics.mx</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FFB020]/10 to-transparent border border-white/10 hover:border-[#FFB020]/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFB020]/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-[#FFB020]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Teléfono</h3>
                    <p className="text-white/60">+52 (844) 123-4567</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#00D084]/10 to-transparent border border-white/10 hover:border-[#00D084]/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00D084]/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[#00D084]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Ubicación</h3>
                    <p className="text-white/60">Monterrey, Nuevo León, México</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
              <p className="text-white/60 text-sm leading-relaxed">
                <span className="text-[#2EE6FF] font-semibold">Respuesta garantizada en 24 horas.</span> Nuestro equipo de expertos 
                analizará tus necesidades y te presentará una propuesta personalizada sin compromiso.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;