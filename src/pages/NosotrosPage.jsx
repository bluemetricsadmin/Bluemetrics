import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LogoBlueMetrics from '../assets/BlueMetrics.png';
import { ArrowLeft, ArrowRight, Database, Droplets, Flame, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const NosotrosPage = () => {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const cardsRef = useRef([]);
  const ctaRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -24 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.2, ease: 'power3.out' }
      );

      gsap.fromTo(
        contentRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      cardsRef.current.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            delay: index * 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const pillars = [
    {
      icon: Droplets,
      title: 'Agua',
      description: 'Visibilidad continua del consumo para detectar desperdicios y actuar con rapidez.',
      color: '#1FB6C9',
      bg: 'from-[#1FB6C9]/15 to-transparent',
    },
    {
      icon: Zap,
      title: 'Energia',
      description: 'Monitoreo inteligente para optimizar demanda, costos operativos y eficiencia.',
      color: '#FFB020',
      bg: 'from-[#FFB020]/15 to-transparent',
    },
    {
      icon: Flame,
      title: 'Gas',
      description: 'Control de consumo y deteccion de comportamientos anormales en tiempo real.',
      color: '#00D084',
      bg: 'from-[#00D084]/15 to-transparent',
    },
    {
      icon: Database,
      title: 'Datos Unificados',
      description: 'Integramos medidores, sensores, Excel y registros manuales en una sola plataforma.',
      color: '#2EE6FF',
      bg: 'from-[#2EE6FF]/15 to-transparent',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1623] via-[#08375F] to-[#0B1623] font-['Inter',sans-serif]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1FB6C9]/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#0A4C8A]/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#2EE6FF]/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <header ref={headerRef} className="relative z-10 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28 pt-8 sm:pt-12">
        <section
          ref={heroRef}
          className="p-8 sm:p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl mb-10 sm:mb-14"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-[#2EE6FF]/10 text-[#2EE6FF] text-sm font-medium mb-5">
            Nosotros
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Inteligencia aplicada al consumo de recursos criticos
          </h1>
          <p className="text-lg sm:text-xl text-white/75 leading-relaxed max-w-4xl">
            BlueMetrics ayuda a empresas e industrias a entender, monitorear y optimizar el consumo de agua,
            energía y gas a través de una plataforma inteligente basada en datos.
          </p>
        </section>

        <section ref={contentRef} className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <article className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0A4C8A]/25 to-transparent border border-white/10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">Datos que se convierten en accion</h2>
            <p className="text-white/75 leading-relaxed">
              Centralizamos información proveniente de medidores, sensores, archivos Excel y registros manuales
              para transformar datos dispersos en indicadores accionables, alertas y visualizaciones en tiempo real.
            </p>
          </article>

          <article className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1FB6C9]/20 to-transparent border border-white/10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">Mision orientada a resultados</h2>
            <p className="text-white/75 leading-relaxed">
              Nuestra misión es ayudar a las organizaciones a reducir desperdicios, detectar anomalías,
              mejorar la toma de decisiones y avanzar hacia una operación más eficiente y sostenible.
            </p>
          </article>

          <article className="lg:col-span-2 p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#08375F]/60 to-[#0B1623]/30 border border-[#2EE6FF]/20">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">Tecnologia, analitica e IA con impacto</h2>
            <p className="text-white/75 leading-relaxed">
              Combinamos tecnología, analítica e inteligencia artificial para convertir el consumo de recursos
              en oportunidades de ahorro e impacto ambiental positivo.
            </p>
          </article>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-14 sm:mb-16">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.title}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className={`p-6 rounded-2xl bg-gradient-to-br ${pillar.bg} border border-white/10 hover:border-white/20 transition-colors`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${pillar.color}25` }}>
                <pillar.icon className="w-6 h-6" style={{ color: pillar.color }} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{pillar.title}</h3>
              <p className="text-white/65 text-sm leading-relaxed">{pillar.description}</p>
            </article>
          ))}
        </section>

        <section
          ref={ctaRef}
          className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0A4C8A]/45 to-[#1FB6C9]/20 border border-[#2EE6FF]/30"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Hagamos visible el potencial de tus datos
              </h2>
              <p className="text-white/75 text-lg">
                Descubre como BlueMetrics puede ayudarte a operar con mayor eficiencia y sostenibilidad.
              </p>
            </div>
            <button
              onClick={() => navigate('/contacto')}
              className="group w-full lg:w-auto px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-[#2EE6FF]/40 text-white font-semibold hover:bg-white/20 hover:border-[#2EE6FF]/70 hover:shadow-[0_0_30px_rgba(46,230,255,0.35)] transition-all duration-300"
            >
              <span className="inline-flex items-center justify-center gap-2">
                Contactar a BlueMetrics
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NosotrosPage;
