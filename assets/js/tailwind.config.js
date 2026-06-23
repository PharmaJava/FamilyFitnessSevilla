/**
 * tailwind.config.js — Configuración de Tailwind (vía CDN, sin paso de build)
 * --------------------------------------------------------------------------
 * Externaliza los tokens de marca (colores y tipografías) de Family Fitness.
 * Tailwind se carga por CDN en index.html / admin.html y lee este objeto
 * a través de `window.tailwind.config`.
 *
 * Paleta de marca (turquesa/teal, según identidad real del gimnasio):
 *   - bg      #0a0a0a  → fondo negro
 *   - coal    #141414  → carbón (secciones)
 *   - card    #1f1f1f  → gris oscuro de tarjetas
 *   - lime    #34c2ab  → acento turquesa/teal (color principal de marca)
 *   - orange  #0e9e8a  → teal profundo (acento secundario)
 *   - grey    #9aa0a3  → gris de marca (del logo)
 *   - white   #ffffff
 */
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  // Modo oscuro forzado por clase en <html class="dark">
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tokens de marca (también disponibles como variables CSS en main.css)
        brand: {
          bg: '#0a0a0a',
          coal: '#141414',
          card: '#1f1f1f',
          lime: '#34c2ab',
          'lime-dark': '#1fa890',
          orange: '#0e9e8a',
          grey: '#9aa0a3',
          white: '#ffffff',
          muted: '#9ca3af',
        },
      },
      fontFamily: {
        // Titulares deportivos + texto legible
        display: ['Anton', 'Oswald', 'Impact', 'sans-serif'],
        heading: ['Oswald', 'Anton', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(52,194,171,.25), 0 12px 40px -12px rgba(52,194,171,.35)',
        card: '0 10px 30px -12px rgba(0,0,0,.6)',
      },
      maxWidth: {
        content: '1200px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '.55' },
        },
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.22,1,.36,1) both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
};
