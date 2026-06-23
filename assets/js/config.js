/**
 * config.js — Fuente de verdad del contenido (valores por defecto)
 * ----------------------------------------------------------------
 * Todo el contenido editable del sitio vive aquí dentro de `window.FF_CONFIG`.
 * Las secciones se renderizan por JS (main.js) leyendo este objeto.
 *
 * Cascada de contenido (ver store.js → getContent()):
 *   1) defaults  → este archivo (config.js)
 *   2) publicado → data/content.json (lo que se publica desde el panel)
 *   3) borrador  → localStorage (cambios locales sin publicar)
 *
 * Para editar en producción NO hace falta tocar este archivo: se usa el
 * panel (admin.html), que guarda overrides y publica un content.json.
 */
window.FF_CONFIG = {
  /* ─────────────────────────  Datos del negocio  ───────────────────────── */
  business: {
    name: 'Family Fitness',
    legalName: 'Gym Family Fitness',
    tagline: 'Tu gimnasio familiar en Sevilla',
    claim: '34 años cuidando tu salud y bienestar con un trato cercano y profesional.',
    phone: '954 57 92 59',
    phoneRaw: '954579259',
    whatsapp: '34954579259',
    whatsappMessage: 'Hola Family Fitness 💪, quiero información para hacerme socio…',
    email: '',
    instagram: 'https://www.instagram.com/familyfitnessnervion',
    instagramHandle: '@familyfitnessnervion',
    address: 'C. Alonso Carrillo, 24, 41007 Sevilla',
    addressLocality: 'Sevilla',
    addressRegion: 'Sevilla',
    postalCode: '41007',
    country: 'ES',
    neighborhood: 'Nervión',
    areaServed: ['Sevilla', 'Nervión', 'Santa Justa', 'San Pablo'],
    // Coordenadas aproximadas del local (verificar antes de producción).
    geo: { lat: 37.38826, lng: -5.97075 },
    rating: 4.7,
    reviewCount: 130,
    yearsExperience: 34,
    priceRange: '€€',
    url: 'https://familyfitnesssevilla.com/',
    // Horario en formato máquina: days = 0(Dom)..6(Sáb)
    schedule: [
      { days: [1, 2, 3, 4, 5], open: '07:00', close: '22:30' },
      { days: [6], open: '09:00', close: '14:00' },
    ],
    scheduleHuman: [
      { label: 'Lunes a Viernes', value: '7:00 – 22:30' },
      { label: 'Sábado', value: '9:00 – 14:00' },
      { label: 'Domingo', value: 'Cerrado' },
    ],
  },

  /* ─────────────────────────────  Imágenes  ───────────────────────────── */
  // Rutas relativas a la raíz. El panel puede sustituirlas por data-URL o
  // por archivos reales subidos a assets/img/.
  // Placeholders SVG de marca: sustitúyelos por fotos reales (.jpg) antes
  // de producción (ver README). El panel ya sube .jpg al publicar.
  images: {
    hero: 'assets/img/hero.svg',
    about: 'assets/img/about.svg',
    og: 'assets/og-image.svg',
  },

  /* ───────────────────────────────  Hero  ─────────────────────────────── */
  hero: {
    title: 'Family Fitness',
    titleAccent: 'Tu gimnasio familiar en Sevilla',
    subtitle: '34 años cuidando tu salud y bienestar con un trato cercano y profesional.',
    ctaPrimary: { label: 'Hazte Socio', href: '#contacto' },
    ctaSecondary: { label: 'Ver Clases y Horarios', href: '#servicios' },
    ctaTertiary: { label: 'Reservar Entrenamiento Personal', href: '#contacto' },
  },

  /* ──────────────────────  Banda de cifras (count-up)  ─────────────────── */
  stats: [
    { value: 34, suffix: '+', label: 'Años en Sevilla' },
    { value: 4.7, suffix: '★', label: 'Valoración Google', decimals: 1 },
    { value: 130, suffix: '+', label: 'Opiniones reales' },
    { value: 1200, suffix: '+', label: 'Socios entrenando' },
  ],

  /* ──────────────────────────  Sobre nosotros  ────────────────────────── */
  about: {
    title: 'Más que un gimnasio, una familia',
    lead: 'Desde hace más de 34 años somos el gimnasio de referencia en el corazón de Sevilla, entre Nervión, Santa Justa y San Pablo.',
    paragraphs: [
      'En Family Fitness creemos que entrenar es mucho mejor cuando te sientes en casa. Aquí no eres un número: nuestros monitores te conocen por tu nombre, te acompañan y adaptan cada entrenamiento a tus objetivos.',
      'Mantenemos las máquinas siempre a punto, cuidamos cada detalle de las instalaciones y ofrecemos una cuota sencilla y sin permanencia: el mes que vienes es el mes que pagas. Así de claro.',
    ],
    values: [
      { icon: 'family', title: 'Ambiente familiar', text: 'Una comunidad cercana donde todos se ayudan y se motivan.' },
      { icon: 'badge', title: 'Profesionalidad', text: 'Monitores cualificados y atentos en todo momento.' },
      { icon: 'heart', title: 'Cercanía', text: 'Trato personalizado y humano, de barrio de toda la vida.' },
      { icon: 'trophy', title: 'Resultados', text: 'Planes adaptados para que consigas tus objetivos.' },
      { icon: 'physio', title: 'Rehabilitación', text: 'Especialistas en recuperación y vuelta a la actividad.' },
    ],
  },

  /* ───────────────────────────  Instalaciones  ────────────────────────── */
  // Galería editable desde el panel.
  facilities: {
    title: 'Nuestras instalaciones',
    subtitle: 'Espacios amplios, limpios y bien equipados para entrenar a gusto.',
    gallery: [
      { src: 'assets/img/gallery-1.svg', alt: 'Sala de máquinas de musculación en Family Fitness Sevilla' },
      { src: 'assets/img/gallery-2.svg', alt: 'Zona de cardio con cintas y elípticas' },
      { src: 'assets/img/gallery-3.svg', alt: 'Sala de clases colectivas y pilates' },
      { src: 'assets/img/gallery-4.svg', alt: 'Zona funcional y de calistenia' },
      { src: 'assets/img/gallery-5.svg', alt: 'Zona de peso libre y mancuernas' },
      { src: 'assets/img/gallery-6.svg', alt: 'Recepción y ambiente familiar del gimnasio' },
    ],
  },

  /* ────────────────────────────  Servicios  ───────────────────────────── */
  services: {
    title: 'Lo que te ofrecemos',
    subtitle: 'Todo lo que necesitas para cuidarte, en un solo sitio.',
    items: [
      { icon: 'dumbbell', title: 'Musculación y Cardio', text: 'Amplia sala de máquinas, peso libre y zona cardio para entrenar a tu ritmo.', note: 'Incluido en la cuota' },
      { icon: 'group', title: 'Clases Colectivas', text: 'Pilates, tonificación y más actividades dirigidas para todos los niveles.', note: 'Incluidas' },
      { icon: 'whistle', title: 'Entrenamiento Personal', text: 'Sesiones individuales o en grupos reducidos con seguimiento cercano.', note: 'Consúltanos' },
      { icon: 'physio', title: 'Rehabilitación y Recuperación', text: 'Programas de recuperación funcional guiados por profesionales.', note: 'Nuestra especialidad' },
      { icon: 'bolt', title: 'Calistenia y Funcional', text: 'Entrenamiento con tu propio peso y trabajo funcional para ganar fuerza real.', note: 'Incluido' },
      { icon: 'family', title: 'Para todas las edades', text: 'Desde jóvenes hasta seniors: planes adaptados a cada etapa de la vida.', note: 'Todos bienvenidos' },
    ],
  },

  /* ───────────────────────────  Por qué elegirnos  ────────────────────── */
  why: {
    title: '¿Por qué Family Fitness?',
    subtitle: 'Lo que nos hace diferentes en Sevilla.',
    items: [
      { icon: 'family', title: 'Ambiente familiar', text: 'Te sentirás como en casa desde el primer día.' },
      { icon: 'badge', title: 'Monitores cualificados', text: 'Atentos, formados y siempre dispuestos a ayudarte.' },
      { icon: 'tools', title: 'Instalaciones cuidadas', text: 'Máquinas revisadas y espacios limpios.' },
      { icon: 'tag', title: 'Sin permanencia', text: 'Precios competitivos. El mes que vas, el mes que pagas.' },
      { icon: 'trophy', title: 'Resultados reales', text: 'Acompañamiento para que consigas tus metas.' },
      { icon: 'physio', title: 'Rehabilitación', text: 'Referentes en recuperación y vuelta a la actividad.' },
    ],
  },

  /* ───────────────────────────  Testimonios  ──────────────────────────── */
  testimonials: {
    title: 'Lo que dicen nuestros socios',
    subtitle: '4,7★ de media en Google con más de 130 opiniones.',
    googleUrl: 'https://www.google.com/search?q=Family+Fitness+Sevilla+opiniones',
    items: [
      { name: 'María L.', rating: 5, text: 'Un gimnasio con un ambiente increíble, te tratan como en familia. Los monitores siempre pendientes de ti.' },
      { name: 'Javier R.', rating: 5, text: 'Llevo años aquí. Vine por una rehabilitación de rodilla y me quedé. Profesionales de verdad.' },
      { name: 'Lucía M.', rating: 5, text: 'Las clases de pilates son geniales y el trato es cercanísimo. Sin permanencia, justo lo que buscaba.' },
      { name: 'Antonio G.', rating: 4, text: 'Buen equipamiento y muy buen precio para lo que ofrece. Gente maja y monitores que saben.' },
      { name: 'Carmen P.', rating: 5, text: 'Mi gimnasio de toda la vida. Limpio, cercano y con un equipo humano fantástico.' },
      { name: 'David S.', rating: 5, text: 'Entreno con un plan personalizado y noto resultados. Recomendado al 100%.' },
    ],
  },

  /* ───────────────────────────────  FAQ  ──────────────────────────────── */
  faq: {
    title: 'Preguntas frecuentes',
    subtitle: 'Resolvemos tus dudas antes de empezar.',
    items: [
      { q: '¿Dónde está Family Fitness?', a: 'Estamos en C. Alonso Carrillo, 24, 41007 Sevilla, entre Nervión, Santa Justa y San Pablo. Muy bien comunicado y con la estación de Santa Justa al lado.' },
      { q: '¿Tienen permanencia?', a: 'No. Nuestra cuota es sencilla y sin permanencia: el mes que vienes es el mes que pagas. Sin sorpresas ni letra pequeña.' },
      { q: '¿Las clases colectivas están incluidas?', a: 'Sí, las clases colectivas (pilates, tonificación y más) están incluidas en la cuota mensual.' },
      { q: '¿Ofrecéis entrenamiento personal?', a: 'Sí. Tenemos sesiones de entrenamiento personal individuales y en grupos reducidos, con seguimiento cercano. Pregúntanos por disponibilidad y precios.' },
      { q: '¿Hacéis rehabilitación?', a: 'Es una de nuestras especialidades. Diseñamos programas de recuperación funcional guiados por profesionales para una vuelta segura a la actividad.' },
      { q: '¿Cuál es el horario?', a: 'Lunes a viernes de 7:00 a 22:30 y sábados de 9:00 a 14:00. Domingos cerrado.' },
      { q: '¿Puedo probar antes de apuntarme?', a: '¡Claro! Llámanos o escríbenos por WhatsApp y te invitamos a conocer el gimnasio y resolver todas tus dudas.' },
    ],
  },

  /* ────────────────────────────  Contacto  ────────────────────────────── */
  contact: {
    title: 'Ven a conocernos',
    subtitle: 'Te esperamos en el centro de Sevilla.',
    // Formulario opcional: si enabled=true se muestra. Conectable a Formspree/EmailJS.
    form: {
      enabled: true,
      provider: 'formspree', // 'formspree' | 'emailjs' | ''
      action: '', // p.ej. https://formspree.io/f/xxxxxxx
    },
  },

  /* ───────────────────────────────  SEO  ──────────────────────────────── */
  seo: {
    title: 'Family Fitness | Gimnasio familiar en Sevilla (Nervión) · +34 años',
    description: 'Gimnasio familiar en Sevilla con más de 34 años de experiencia. Musculación, clases, entrenamiento personal y rehabilitación. Sin permanencia. ¡Hazte socio!',
    keywords: 'gimnasio en Sevilla, gimnasio familiar Sevilla, Family Fitness Sevilla, entrenamiento personal Sevilla, rehabilitación Sevilla, gimnasio Nervión',
    ogImage: 'assets/og-image.svg',
    locale: 'es_ES',
  },

  /* ──────────────────────────────  Footer  ────────────────────────────── */
  footer: {
    tagline: 'Tu gimnasio familiar en Sevilla desde hace más de 34 años.',
    nav: [
      { label: 'Sobre nosotros', href: '#sobre-nosotros' },
      { label: 'Instalaciones', href: '#instalaciones' },
      { label: 'Servicios', href: '#servicios' },
      { label: 'Testimonios', href: '#testimonios' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contacto', href: '#contacto' },
    ],
  },

  /* ───────────────────  Configuración del panel / GitHub  ──────────────── */
  admin: {
    // SHA-256 del código de acceso por defecto ("familyfitness").
    // Cambiable desde el propio panel (se guarda un nuevo hash en localStorage).
    accessHash: '29b6259ffd07bdcdd2640692f36adda178433a2265d70736afbf572cf65ff299',
  },
  github: {
    owner: 'PharmaJava',
    repo: 'FamilyFitnessSevilla',
    branch: 'main',
    contentPath: 'data/content.json',
    imgDir: 'assets/img',
  },
};
