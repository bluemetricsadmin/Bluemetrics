import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TecIcon from '../assets/tec.svg';
import LogoBlueMetrics from '../assets/BlueMetrics.png';
import { Link, useNavigate } from 'react-router';
import { FaLinkedin } from 'react-icons/fa';
import { FaInstagram } from 'react-icons/fa6';

import { 
  Droplets, 
  Zap, 
  Flame, 
  ChevronDown, 
  Play, 
  Download, 
  ArrowRight,
  Cpu,
  Wifi,
  Shield,
  BarChart3,
  Clock,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// DESIGN TOKENS - BlueMetrics Design System
// ============================================================================
const colors = {
  primary: '#0A4C8A',
  deepBlue: '#08375F',
  aqua: '#1FB6C9',
  cyan: '#2EE6FF',
  darkNavy: '#0B1623',
  graphite: '#3A3F45',
  lightGray: '#E6EDF3',
  white: '#FFFFFF',
  success: '#00D084',
  warning: '#FFB020',
};

// ============================================================================
// HEADER COMPONENT - Sticky Navigation
// ============================================================================
const Header = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const headerRef = useRef(null);
  const menuItemsRef = useRef([]);
  const underlineRefs = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Header fade + slide animation on load
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );

    // Menu items stagger animation
    gsap.fromTo(menuItemsRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
    );
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const toggleMobileSubmenu = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  const handleNavigation = (path) => {
    setIsMobileMenuOpen(false);
    setOpenSubmenu(null);
    // Scroll to section or navigate
    const element = document.getElementById(path);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const menuItems = [
    { label: 'Soluciones', submenu: [
      { name: 'Agua', path: 'agua-section' },
      { name: 'Electricidad', path: 'electricidad-section' },
      { name: 'Gas', path: 'gas-section' }
    ]},
    { label: 'Tecnología', submenu: [
      { name: 'IA Predictiva', path: 'ia-section' },
      { name: 'Hardware & IoT', path: 'hardware-section' }
    ]},
    { label: 'Sectores', submenu: [
      { name: 'Industrial', path: 'industrial-section' },
      { name: 'Salud', path: 'salud-section' },
      { name: 'Campus', path: 'campus-section' }
    ]},
    
  ];

  return (
    <header 
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-[#0B1623]/90 backdrop-blur-xl shadow-lg shadow-black/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <img
            src={LogoBlueMetrics}
            alt="BlueMetrics MX"
            className="h-8 sm:h-10 w-auto object-contain cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {menuItems.map((item, index) => (
              <div 
                key={item.label}
                ref={el => menuItemsRef.current[index] = el}
                className="relative group"
              >
                <button className="text-white/80 hover:text-white transition-colors py-2 flex items-center gap-1 font-medium">
                  {item.label}
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                </button>
                <span 
                  ref={el => underlineRefs.current[index] = el}
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2EE6FF] origin-left scale-x-0"
                />
                {/* Dropdown */}
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="bg-[#0B1623]/95 backdrop-blur-xl rounded-xl border border-[#2EE6FF]/20 p-2 min-w-[180px] shadow-xl">
                    {item.submenu.map((sub) => (
                      <button 
                        key={sub.name}
                        onClick={() => handleNavigation(sub.path)}
                        className="block w-full text-left px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <button 
              onClick={handleLogin}
              className="relative px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-[#2EE6FF]/40 text-white font-medium hover:bg-white/20 hover:border-[#2EE6FF]/60 hover:shadow-[0_0_30px_rgba(46,230,255,0.3)] transition-all duration-300"
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="mt-4 pb-4 border-t border-white/10 pt-4 bg-[#0B1623]/95 backdrop-blur-xl rounded-b-xl">
            {menuItems.map((item, index) => (
              <div key={item.label} className="py-1">
                <button 
                  onClick={() => toggleMobileSubmenu(index)}
                  className="w-full flex items-center justify-between px-4 py-3 text-white font-medium hover:bg-white/5 rounded-lg transition-colors"
                >
                  {item.label}
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform duration-300 ${
                      openSubmenu === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    openSubmenu === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pl-6 pr-4 pb-2 space-y-1">
                    {item.submenu.map((sub) => (
                      <button 
                        key={sub.name}
                        onClick={() => handleNavigation(sub.path)}
                        className="block w-full text-left px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="px-4 pt-4">
              <button 
                onClick={handleLogin}
                className="w-full px-6 py-3 rounded-xl bg-[#2EE6FF]/20 backdrop-blur-md border border-[#2EE6FF]/40 text-white font-medium hover:bg-[#2EE6FF]/30 transition-all duration-300"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// HERO SECTION - Main Landing Area with Video Background Placeholder
// ============================================================================
const HeroSection = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const headlineRef = useRef(null);
  const subheadlineRef = useRef(null);
  const ctaRef = useRef(null);
  const specialTextRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Simple fade in for headline (preserve HTML structure)
      gsap.fromTo(headlineRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.5 }
      );

      // Subheadline fade in
      gsap.fromTo(subheadlineRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 1.5 }
      );

      // CTA buttons animation
      gsap.fromTo(ctaRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: 'power3.out', delay: 2 }
      );
      
      // Passive floating animation for headline only - smooth and fluid
      if (headlineRef.current) {
        gsap.to(headlineRef.current, {
          y: -10,
          duration: 6,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
          delay: 2.5
        });
      }
      
      // Continuous subtle animation for special text (50% less bright)
      if (specialTextRef.current) {
        gsap.to(specialTextRef.current, {
          textShadow: '0 0 10px rgba(46, 230, 255, 0.3), 0 0 20px rgba(31, 182, 201, 0.15)',
          duration: 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true
        });
      }

    }, heroRef);

    return () => ctx.revert();
  }, []);
  
  const handleSpecialTextHover = (isEntering) => {
    if (!specialTextRef.current) return;
    
    const chars = specialTextRef.current.querySelectorAll('.char');
    
    if (isEntering) {
      // Create living, breathing effect
      const tl = gsap.timeline();
      
      // Wave distortion effect - each letter jumps with elastic bounce
      chars.forEach((char, i) => {
        tl.to(char, {
          y: -20,
          scale: 1.2,
          rotationX: 360,
          duration: 0.7,
          ease: 'elastic.out(1, 0.3)',
          delay: i * 0.05
        }, 0);
      });
      
      // Continuous floating while hovering
      chars.forEach((char, i) => {
        gsap.to(char, {
          y: '+=15',
          rotation: '+=5',
          duration: 1.5 + (i * 0.1),
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.1
        });
      });
      
      // Intense glow effect on the whole span
      gsap.to(specialTextRef.current, {
        filter: 'brightness(1.8) saturate(2) drop-shadow(0 0 30px rgba(46, 230, 255, 1)) drop-shadow(0 0 60px rgba(46, 230, 255, 0.8))',
        duration: 0.4,
        ease: 'power2.out'
      });
      
    } else {
      // Return to normal with smooth transition
      gsap.killTweensOf(chars);
      
      chars.forEach((char, i) => {
        gsap.to(char, {
          y: 0,
          scale: 1,
          rotationX: 0,
          rotation: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          delay: i * 0.03
        });
      });
      
      gsap.to(specialTextRef.current, {
        filter: 'brightness(1) saturate(1) drop-shadow(0 0 20px rgba(46, 230, 255, 0.5))',
        duration: 0.6,
        ease: 'power2.inOut'
      });
    }
  };

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0B1623]"
    >
      {/* VIDEO BACKGROUND – YouTube Embed */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <iframe
          className="absolute top-1/2 left-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2"
          src="https://www.youtube.com/embed/c5nEP4V6gyE?autoplay=1&mute=1&loop=1&playlist=c5nEP4V6gyE&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
          title="Background Video"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>

      {/* Gradient Overlay - Reduced opacity to show more video */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1623]/40 via-[#0B1623]/30 to-[#08375F]/50" />
      
      {/* Animated Background Elements - Reduced opacity */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1FB6C9]/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#0A4C8A]/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#2EE6FF]/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Grid Pattern Overlay - Removed for better video visibility */}

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <h1 
          ref={headlineRef}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 leading-tight"
          style={{ perspective: '1000px' }}
        >
          La Era de la{' '}
          <span 
            ref={specialTextRef}
            className="relative inline-block cursor-pointer select-none"
            onMouseEnter={() => handleSpecialTextHover(true)}
            onMouseLeave={() => handleSpecialTextHover(false)}
            style={{ 
              color: '#2EE6FF',
              textShadow: '0 0 10px rgba(46, 230, 255, 0.4), 0 0 20px rgba(31, 182, 201, 0.3)',
              fontWeight: 'bold'
            }}
          >
            {['E','f','i','c','i','e','n','c','i','a',' ','I','n','v','i','s','i','b','l','e'].map((char, i) => (
              <span 
                key={i} 
                className="char"
                style={{ display: 'inline-block', transformOrigin: 'center center' }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
          .
        </h1>
        
        <p 
          ref={subheadlineRef}
          className="text-base sm:text-lg font-bold md:text-xl lg:text-2xl text-white
                      max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2
                      filter-[drop-shadow(0_2px_6px_rgba(0,0,0,0.4))_drop-shadow(0_0_18px_rgba(56,189,248,0.85))]"
        >
          Control absoluto sobre su consumo de <span className="text-[#1FB6C9]">Agua</span>, <span className="text-[#FFB020]">Electricidad</span> y <span className="text-[#00D084]">Gas</span>.<br/>
          BlueMetrics fusiona Inteligencia Artificial y telemetría avanzada para predecir riesgos, 
          eliminar desperdicios y garantizar la rentabilidad de su infraestructura crítica.
        </p>

        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
          {/* Primary CTA - Glassmorphism */}
          <button 
            onClick={() => navigate('/contacto')}
            className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-[#2EE6FF]/40 text-white font-semibold text-base sm:text-lg hover:bg-white/20 hover:border-[#2EE6FF]/80 hover:shadow-[0_0_40px_rgba(46,230,255,0.4)] hover:scale-105 transition-all duration-500 animate-pulse-slow"
          >
            <span className="relative z-10 flex items-center gap-2">
              Calcular mi Ahorro Potencial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          {/* Secondary CTA */}
          <button 
            onClick={() => navigate('/contacto')}
            className="group flex items-center gap-2 text-white/80 hover:text-white font-medium text-base sm:text-lg transition-all hover:scale-110"
          >
            <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center group-hover:border-[#2EE6FF] group-hover:bg-[#2EE6FF]/10 group-hover:rotate-90 transition-all duration-500">
              <Play className="w-5 h-5 ml-0.5" />
            </div>
            Ver Demostración
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer hover:scale-125 transition-transform">
        <ChevronDown className="w-8 h-8 text-white/40 hover:text-[#2EE6FF] transition-colors" />
      </div>

      {/* Bottom Blur Merge Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#08375F] via-[#08375F]/35 to-transparent" />
        <div className="absolute -inset-6 bg-[#08375F]/10 blur-2xl" />
      </div>
    </section>
  );
};

// ============================================================================
// TRIPLE PLAY SECTION - Ecosystem Cards
// ============================================================================
const TriplePlaySection = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const borderRefs = useRef([]);
  const iconRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Cards stagger animation with elastic effect
      cardsRef.current.forEach((card, index) => {
        gsap.fromTo(card,
          { opacity: 0, y: 80, scale: 0.9, rotationY: -15 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationY: 0,
            duration: 1,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            },
            delay: index * 0.2
          }
        );
      });
      
      // Continuous floating animation for icons
      iconRefs.current.forEach((icon, index) => {
        if (icon) {
          gsap.to(icon, {
            y: -15,
            duration: 2 + index * 0.3,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: index * 0.4
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleCardHover = (index, isEntering) => {
    const tl = gsap.timeline();
    
    if (cardsRef.current[index]) {
      tl.to(cardsRef.current[index], {
        scale: isEntering ? 1.05 : 1,
        y: isEntering ? -10 : 0,
        rotationY: isEntering ? 5 : 0,
        boxShadow: isEntering 
          ? '0 25px 50px -12px rgba(46, 230, 255, 0.4)' 
          : '0 0 0 0 transparent',
        duration: 0.6,
        ease: isEntering ? 'back.out(1.7)' : 'power2.inOut'
      }, 0);
    }
    
    // Animate icon with bounce
    if (iconRefs.current[index]) {
      tl.to(iconRefs.current[index], {
        scale: isEntering ? 1.2 : 1,
        rotation: isEntering ? 360 : 0,
        duration: 0.8,
        ease: isEntering ? 'elastic.out(1, 0.5)' : 'power2.inOut'
      }, 0);
    }
    
    // Animate border on hover
    if (borderRefs.current[index]) {
      const border = borderRefs.current[index];
      if (isEntering) {
        tl.fromTo(border,
          { strokeDashoffset: 1000 },
          { 
            strokeDashoffset: 0, 
            duration: 1.2, 
            ease: 'power2.inOut'
          }, 0
        );
      } else {
        tl.to(border, {
          strokeDashoffset: 1000,
          duration: 0.6,
          ease: 'power2.in'
        }, 0);
      }
    }
  };

  const cards = [
    {
      icon: Droplets,
      title: 'Inteligencia Hídrica',
      description: 'Detección de fugas en milisegundos y balance hidrológico automatizado.',
      color: '#1FB6C9',
      gradient: 'from-[#1FB6C9]/20 to-[#0A4C8A]/20'
    },
    {
      icon: Zap,
      title: 'Inteligencia Eléctrica',
      description: 'Predicción de picos de demanda y optimización del factor de potencia.',
      color: '#FFB020',
      gradient: 'from-[#FFB020]/20 to-[#0A4C8A]/20'
    },
    {
      icon: Flame,
      title: 'Inteligencia en Gas',
      description: 'Monitoreo de flujo volumétrico y alertas críticas fuera de programas de producción.',
      color: '#00D084',
      gradient: 'from-[#00D084]/20 to-[#0A4C8A]/20'
    }
  ];

  return (
    <section ref={sectionRef} className="py-32 bg-gradient-to-b from-[#08375F] to-[#0B1623]">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={titleRef} className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Una plataforma. Tres recursos. <span className="text-[#2EE6FF]">Control total.</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Ecosistema integrado para la gestión inteligente de recursos críticos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={card.title}
              ref={el => cardsRef.current[index] = el}
              className={`relative p-8 rounded-3xl bg-gradient-to-br ${card.gradient} backdrop-blur-xl border border-white/10 cursor-pointer transition-all duration-500`}
              onMouseEnter={() => handleCardHover(index, true)}
              onMouseLeave={() => handleCardHover(index, false)}
            >
              {/* Icon */}
              <div 
                ref={el => iconRefs.current[index] = el}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <card.icon className="w-8 h-8" style={{ color: card.color }} />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-white mb-4">{card.title}</h3>
              <p className="text-white/60 leading-relaxed">{card.description}</p>

              {/* Hover Glow Effect */}
              <div 
                className="absolute inset-0 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${card.color}10 0%, transparent 80%)`
                }}
              />
              
              {/* Animated Border */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                <rect
                  ref={el => borderRefs.current[index] = el}
                  x="2"
                  y="2"
                  width="calc(100% - 4px)"
                  height="calc(100% - 4px)"
                  rx="24"
                  ry="24"
                  fill="none"
                  stroke={card.color}
                  strokeWidth="3"
                  strokeDasharray="800 200"
                  strokeDashoffset="1000"
                  opacity="0.8"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// IA PREDICTION SECTION
// ============================================================================
const IAPredictionSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const counterRef = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Content reveal animation
      gsap.fromTo(contentRef.current.children,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Counter animation
      ScrollTrigger.create({
        trigger: counterRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.to({}, {
            duration: 2,
            ease: 'power3.out',
            onUpdate: function() {
              setCount(Math.round(this.progress() * 2000));
            }
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-[#0B1623] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#0A4C8A]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2EE6FF]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div ref={contentRef}>
            <span className="inline-block px-4 py-2 rounded-full bg-[#2EE6FF]/10 text-[#2EE6FF] text-sm font-medium mb-6">
              Inteligencia Artificial
            </span>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Su infraestructura ahora tiene <span className="text-[#2EE6FF]">voz.</span>
            </h2>
            
            <p className="text-lg text-white/60 mb-8 leading-relaxed">
              Nuestra IA no solo mide; entiende sus procesos, aprende de sus patrones operativos 
              y anticipa anomalías antes de que se conviertan en pérdidas. Cada sensor alimenta 
              un cerebro digital que trabaja 24/7 para proteger su inversión.
            </p>

            {/* Highlight Box */}
            <div 
              ref={counterRef}
              className="p-6 rounded-2xl bg-gradient-to-r from-[#FFB020]/10 to-transparent border-l-4 border-[#FFB020]"
            >
              <p className="text-white/80 mb-2">Evite pérdidas invisibles que pueden promediar los</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-[#FFB020]">${count.toLocaleString()}</span>
                <span className="text-2xl text-white/60">USD</span>
              </div>
              <p className="text-white/60 mt-2">por evento no detectado</p>
            </div>
          </div>

          {/* Visual Element - AI Brain Visualization */}
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#0A4C8A]/30 to-[#08375F]/50 border border-white/10 p-8 relative overflow-hidden">
              {/* Animated Circles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full border border-[#2EE6FF]/20 animate-pulse" />
                <div className="absolute w-48 h-48 rounded-full border border-[#2EE6FF]/30 animate-pulse animation-delay-2000" />
                <div className="absolute w-32 h-32 rounded-full border border-[#2EE6FF]/40 animate-pulse animation-delay-4000" />
                <div className="absolute w-16 h-16 rounded-full bg-[#2EE6FF]/20 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-[#2EE6FF]" />
                </div>
              </div>

              {/* Data Points */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-[#2EE6FF] animate-ping"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// ROI ENGINE SECTION - Interactive Calculator
// ============================================================================
const ROIEngineSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [industry, setIndustry] = useState(50);
  const [monthlySpend, setMonthlySpend] = useState(50000);
  const [squareMeters, setSquareMeters] = useState(5000);

  // Simulated ROI calculations
  const savingsPercent = 15 + (industry / 100) * 10;
  const annualSavings = Math.round(monthlySpend * 12 * (savingsPercent / 100));
  const paybackMonths = Math.round((monthlySpend * 2) / (annualSavings / 12));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current.querySelector('.roi-content'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const industries = ['Manufactura', 'Hospitalario', 'Educación', 'Comercial', 'Industrial'];

  return (
    <section ref={sectionRef} className="py-32 bg-gradient-to-b from-[#0B1623] to-[#08375F]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="roi-content">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-[#00D084]/10 text-[#00D084] text-sm font-medium mb-6">
              ROI Engine
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              BlueMetrics <span className="text-[#2EE6FF]">ROI Engine</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Calcule su potencial de ahorro en menos de 60 segundos
            </p>
          </div>

          {/* Calculator Interface */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Inputs */}
            <div className="space-y-8 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
              {/* Industry Slider */}
              <div>
                <label className="block text-white font-medium mb-4">Tipo de Industria</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={industry}
                  onChange={(e) => setIndustry(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2EE6FF] [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(46,230,255,0.5)]"
                />
                <div className="flex justify-between mt-2 text-sm text-white/40">
                  {industries.map((ind, i) => (
                    <span key={ind} className={industry >= (i * 25) && industry < ((i + 1) * 25) ? 'text-[#2EE6FF]' : ''}>
                      {ind}
                    </span>
                  ))}
                </div>
              </div>

              {/* Monthly Spend Slider */}
              <div>
                <label className="block text-white font-medium mb-4">
                  Gasto Mensual en Servicios: <span className="text-[#2EE6FF]">${monthlySpend.toLocaleString()} MXN</span>
                </label>
                <input
                  type="range"
                  min="10000"
                  max="500000"
                  step="5000"
                  value={monthlySpend}
                  onChange={(e) => setMonthlySpend(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2EE6FF] [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(46,230,255,0.5)]"
                />
              </div>

              {/* Square Meters Slider */}
              <div>
                <label className="block text-white font-medium mb-4">
                  Metros Cuadrados: <span className="text-[#2EE6FF]">{squareMeters.toLocaleString()} m²</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={squareMeters}
                  onChange={(e) => setSquareMeters(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2EE6FF] [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(46,230,255,0.5)]"
                />
              </div>
            </div>

            {/* Results */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0A4C8A]/30 to-[#08375F]/50 border border-[#2EE6FF]/20 relative overflow-hidden">
              {/* Glow Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2EE6FF]/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-8">Resultados Proyectados</h3>

                {/* Savings Chart Placeholder */}
                <div className="mb-8">
                  <div className="flex items-end gap-2 h-32">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-[#2EE6FF] to-[#0A4C8A] rounded-t-lg transition-all duration-500"
                        style={{ height: `${30 + (i * 5) + Math.random() * 20}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-white/40">
                    <span>Ene</span>
                    <span>Jun</span>
                    <span>Dic</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-white/60 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Ahorro a 12 meses</span>
                    </div>
                    <p className="text-3xl font-bold text-[#00D084]">
                      ${annualSavings.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-white/60 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Tiempo de recuperación</span>
                    </div>
                    <p className="text-3xl font-bold text-[#2EE6FF]">
                      {paybackMonths} meses
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button 
                  onClick={() => navigate('/contacto')}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#0A4C8A] to-[#1FB6C9] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(31,182,201,0.4)] transition-all duration-300"
                >
                  <Download className="w-5 h-5" />
                  Solicitar Información ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// TECHNOLOGY SECTION
// ============================================================================
const TechnologySection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        gsap.fromTo(card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            },
            delay: index * 0.1
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const techFeatures = [
    { icon: Cpu, title: 'IA Predictiva', description: 'Algoritmos de machine learning entrenados con millones de datos operativos' },
    { icon: Wifi, title: 'IoT Industrial', description: 'Sensores de grado industrial con conectividad redundante' },
    { icon: Shield, title: 'Seguridad Enterprise', description: 'Encriptación end-to-end y cumplimiento SOC 2' },
    { icon: BarChart3, title: 'Analytics Avanzado', description: 'Dashboards personalizables con exportación a SAP' },
  ];

  return (
    <section ref={sectionRef} className="py-32 bg-[#08375F]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Hardware inteligente. <span className="text-[#2EE6FF]">Software de clase mundial.</span>
          </h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Infraestructura agnóstica que se integra con sus sistemas existentes. 
            Sensores IoT de última generación con integración futura a SAP y otros ERPs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {techFeatures.map((feature, index) => (
            <div
              key={feature.title}
              ref={el => cardsRef.current[index] = el}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#2EE6FF]/30 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#2EE6FF]/10 flex items-center justify-center mb-4 group-hover:bg-[#2EE6FF]/20 transition-colors">
                <feature.icon className="w-6 h-6 text-[#2EE6FF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// SOCIAL PROOF SECTION
// ============================================================================
const SocialProofSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const logosRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      logosRef.current.forEach((logo, index) => {
        gsap.fromTo(logo,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: logo,
              start: 'top 90%',
              toggleActions: 'play none none reverse'
            },
            delay: index * 0.1
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return null;
};

// ============================================================================
// FOOTER SECTION
// ============================================================================
const FooterSection = () => {
  const navigate = useNavigate();
  const footerRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(ctaRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="bg-[#0B1623] border-t border-white/10">
      {/* Final CTA */}
      <div ref={ctaRef} className="py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Deje de gestionar recibos. <br />
            <span className="text-[#2EE6FF]">Empiece a gestionar datos.</span>
          </h2>
          
          <button 
            onClick={() => navigate('/contacto')}
            className="mt-8 px-10 py-5 rounded-2xl bg-gradient-to-r from-[#0A4C8A] to-[#1FB6C9] text-white font-semibold text-lg hover:shadow-[0_0_40px_rgba(31,182,201,0.5)] transition-all duration-500 group"
          >
            <span className="flex items-center gap-2">
              Comenzar mi transformación digital
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <p className="mt-6 text-white/40">
            Instalación ágil. Interfaz intuitiva. Resultados garantizados.
          </p>
        </div>
      </div>

      {/* Footer Links */}
      <div className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={LogoBlueMetrics}
                  alt="BlueMetrics MX"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <p className="text-white/40 text-sm">
                Inteligencia invisible que protege recursos críticos.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Soluciones</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Agua</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Electricidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gas</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><Link to="/nosotros" className="hover:text-white transition-colors">Nosotros</Link></li>
                
                <li><button onClick={() => navigate('/contacto')} className="hover:text-white transition-colors">Contacto</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-sm">
              © 2026 BlueMetrics MX. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
            
            
              <a href="https://www.linkedin.com/company/108869672/admin/page-posts/published/" className="text-white/30 hover:text-white transition-colors text-sm"><FaLinkedin className='text-2xl' /></a>
              <a href="https://www.instagram.com/blue_metrics_ai?igsh=anY5bWdicnBuMDNn" className="text-white/30 hover:text-white transition-colors text-sm"><FaInstagram className='text-2xl' /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================
const LandingPage = () => {
  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Cleanup ScrollTrigger on unmount
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="bg-[#0B1623] min-h-screen font-['Inter',sans-serif]">
      <Header />
      <HeroSection />
      <TriplePlaySection />
      <IAPredictionSection />
      <ROIEngineSection />
      <TechnologySection />
      <SocialProofSection />
      <FooterSection />
    </div>
  );
};

export default LandingPage;