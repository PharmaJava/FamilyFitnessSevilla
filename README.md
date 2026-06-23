# Family Fitness — Web del gimnasio familiar en Sevilla

Web moderna, enérgica y 100% responsive para **Family Fitness** (Gym Family Fitness), el gimnasio familiar de Sevilla con más de 34 años de experiencia. Sitio estático (HTML + Tailwind por CDN, sin paso de build), totalmente **data-driven** y con un **panel de administración** para que el gimnasio gestione su web sin tocar código y publique los cambios directamente a GitHub.

> _"Tu gimnasio familiar en Sevilla"_ · C. Alonso Carrillo, 24, 41007 Sevilla · 📞 954 57 92 59

---

## ✨ Características

- **Single-page** con hero a pantalla completa, banda de cifras (count-up), sobre nosotros, instalaciones, servicios, por qué elegirnos, testimonios, FAQ, ubicación y contacto.
- **Contenido editable** sin tocar código desde `admin.html`.
- **Indicador "Abierto ahora / Cerrado · abre…"** calculado en vivo desde el horario.
- **SEO local a tope** para Sevilla: meta tags, geo, Open Graph/Twitter, `JSON-LD` (`HealthClub`, `WebSite`, `BreadcrumbList`, `FAQPage`), `robots.txt`, `sitemap.xml` y `site.webmanifest`.
- **Conversión**: CTAs "Hazte Socio", teléfono click-to-call, WhatsApp con mensaje predefinido, "Cómo llegar", barra de acción inferior en móvil y botones flotantes en escritorio.
- **Rendimiento y accesibilidad**: mobile-first, `preconnect`/`preload`, imágenes anti-CLS, `loading="lazy"`, reveal al hacer scroll, menú accesible, `prefers-reduced-motion`, "saltar al contenido".

---

## 📁 Estructura

```
index.html              · Página principal (single-page)
admin.html              · Panel de administración (noindex)
robots.txt              · Reglas de rastreo (Disallow /admin.html)
sitemap.xml             · Mapa del sitio
site.webmanifest        · PWA (tema oscuro)
data/
  content.json          · Contenido PUBLICADO (lo escribe el panel)
  content.sample.json   · Ejemplo de content.json
assets/
  css/
    main.css            · Tokens, animaciones y componentes
    admin.css           · Estilos del panel
  js/
    tailwind.config.js  · Tokens de marca de Tailwind (CDN)
    config.js           · FUENTE DE VERDAD del contenido (window.FF_CONFIG)
    store.js            · Almacenamiento + cascada de contenido (window.FFStore)
    main.js             · Render del sitio, animaciones y JSON-LD
    github.js           · Publicación a GitHub (window.FFGitHub)
    admin.js            · Lógica del panel
  img/                  · Imágenes (placeholders SVG → sustituir por fotos)
  icons/                · Logo e icono SVG
  og-image.svg          · Imagen para redes sociales (sustituir por JPG 1200×630)
```

### ¿Cómo funciona el contenido? (cascada)

El contenido final se obtiene fusionando **tres capas** (ver `assets/js/store.js → getContent()`):

1. **Defaults** → `assets/js/config.js` (`window.FF_CONFIG`).
2. **Publicado** → `data/content.json` (lo que se sube desde el panel).
3. **Borrador local** → `localStorage` (cambios hechos en el panel y aún sin publicar).

La fusión es **profunda** para objetos; los **arrays se reemplazan** por completo.

---

## 🚀 Uso y despliegue

Es un sitio **100% estático**: no necesita compilar nada.

### Probar en local

Como `main.js` hace `fetch('data/content.json')`, ábrelo con un servidor (no con `file://`):

```bash
# Opción 1: Python
python3 -m http.server 8080

# Opción 2: Node
npx serve .
```

Luego visita `http://localhost:8080`.

### Desplegar

Sube el repositorio a cualquier hosting estático:

- **GitHub Pages**: Settings → Pages → Deploy from branch (`main`, carpeta `/root`).
- **Netlify / Vercel**: importa el repo; sin comando de build, carpeta de publicación = raíz.

Cuando el panel publica cambios, el hosting **redespliega solo** y los cambios quedan online en segundos.

> Recuerda actualizar las URLs absolutas (`https://familyfitnesssevilla.com/`) en `index.html`, `sitemap.xml` y `robots.txt` por tu dominio real.

---

## 🔐 Panel de administración (`admin.html`)

Acceso discreto desde el enlace **"Acceso"** del footer.

- **Código por defecto:** `@Family123!`
  - Se valida con **SHA-256** (`crypto.subtle`); el hash por defecto está en `config.js → admin.accessHash`.
  - Cámbialo desde el propio panel (sección **🔒 Código de acceso**). El nuevo hash se guarda en tu navegador.
  - La sesión se guarda en `sessionStorage` (se cierra con **Salir** o al cerrar el navegador).

### Qué puedes hacer

- **Datos del negocio**: nombre, reclamo, teléfono, WhatsApp, Instagram, valoración, dirección, mensaje de WhatsApp, subtítulo del hero…
- **Imágenes**: cambiar portada (hero) y "Sobre nosotros", y gestionar la **galería de instalaciones** (arrastrar y soltar, selector o URL). Se **redimensionan en tu navegador** (máx. ~1280 px, JPEG ~0.82) para que carguen rápido. Eliminar con un clic.
- **Copia de seguridad**: exportar/importar toda la configuración como JSON y restablecer a valores por defecto. Muestra el uso de almacenamiento.

> Los cambios se guardan primero como **borrador local**. Para que se vean online hay que **Publicar**.

---

## 🌐 Conectar GitHub y publicar

Para publicar desde el panel necesitas un **token fine-grained** de GitHub (opción "token en el navegador").

1. En el panel, sección **🔗 Conexión con GitHub**, rellena `owner`, `repo` y `rama` (vienen prerrellenados desde `config.js → github`).
2. Crea el token:
   - **GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.**
   - **Repository access:** _Only select repositories_ → este repositorio.
   - **Permissions → Repository permissions → Contents: _Read and write_** (es el **mínimo** necesario).
   - Genera, copia y pega el token en el panel. Pulsa **Guardar** y **Probar conexión**.
3. Pulsa **🚀 Publicar en la web**. El panel:
   - Sube las **imágenes nuevas** (data-URL) como archivos reales a `assets/img/`.
   - Escribe `data/content.json` (resolviendo el `sha` previo; base64 correcto para texto e imágenes).
   - El hosting **redespliega solo** → cambios online para todos en segundos.

> ⚠️ **Seguridad del token:** vive en tu navegador (`localStorage`). Usa uno **limitado a este repositorio** y con **sólo** permiso _Contents: Read and write_. Si se filtra, **revócalo** desde GitHub. La copia de seguridad exportada **no** incluye el token.

---

## 🖼️ Qué sustituir antes de producción

Los archivos de imagen son **placeholders SVG de marca**. Sustitúyelos por fotos reales:

| Sustituir | Por |
| --- | --- |
| `assets/img/hero.svg` | Foto potente del gimnasio (gente entrenando, sala, clase) |
| `assets/img/about.svg` | Foto del equipo / ambiente familiar |
| `assets/img/gallery-1..6.svg` | Fotos de instalaciones (máquinas, cardio, clases, funcional…) |
| `assets/og-image.svg` | Imagen para redes **JPG 1200×630** (`assets/og-image.jpg`) |
| `assets/icons/logo.svg`, `favicon.svg` | Logo/icono reales si los tienes |

Puedes hacerlo desde el **panel** (hero, about y galería) o subiendo los archivos al repo. Si cambias a `.jpg`, actualiza también las rutas en `config.js` y el `preload`/`og:image` de `index.html`.

**Datos a revisar** en `assets/js/config.js`:

- `business.geo` (coordenadas exactas del local; las actuales son aproximadas) y las geo-meta de `index.html`.
- `business.url` y las URLs absolutas (dominio real) en `index.html`, `sitemap.xml`, `robots.txt`.
- `business.schedule` (horario en formato máquina que alimenta el indicador "Abierto ahora").
- `contact.form` si quieres formulario: pon `action` (Formspree) o intégralo con EmailJS. Sin `action`, el formulario cae elegantemente a WhatsApp.

### Sugerencias de imágenes e iconos

- **Fotos**: gente entrenando con energía, comunidad/ambiente familiar, clases en grupo, sala de máquinas limpia, zona funcional/calistenia, recepción.
- **Iconos** (ya incluidos como SVG en `main.js`): pesas, comunidad/familia, corazón, trofeo, fisioterapia/rehabilitación, rayo (funcional), etiqueta (precio), herramientas (mantenimiento).

---

## 🎨 Marca

- **Paleta**: negro `#0a0a0a`, carbón `#141414`, tarjeta `#1f1f1f`, **verde lima `#a3e635`** (principal), naranja `#f97316` (secundario), blanco `#ffffff`.
- **Tipografías**: `Anton`/`Oswald` (titulares deportivos) + `Inter` (texto), con `font-display: swap`.

Edita los tokens en `assets/js/tailwind.config.js` y `assets/css/main.css` (variables `:root`).

---

## 🔭 Mejoras futuras

- 🛒 **Tienda online de suplementos**.
- 📝 **Blog de entrenamiento** (SEO de contenidos).
- 📅 **App / portal de reservas de clases**.
- 👤 **Área de socios** (perfil, plan de entrenamiento, seguimiento).
- 💳 **Integración con pasarela de pago** para cuotas (Stripe/Redsys).
- ⭐ Reseñas dinámicas vía API de Google.

---

## 🛠️ Detalles técnicos

- **Sin build**: Tailwind por CDN con config externalizada en `assets/js/tailwind.config.js`.
- **Scripts** con `defer` y responsabilidad única por módulo.
- **JSON-LD** generado dinámicamente desde el contenido (se mantiene siempre en sincronía con lo que ve el usuario).
- **Accesibilidad**: landmarks, `aria-*` en menú y FAQ, `:focus-visible`, `scroll-margin-top`, `prefers-reduced-motion`.

---

Hecho con 💪 para la familia de **Family Fitness Sevilla**.
