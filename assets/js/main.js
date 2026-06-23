/**
 * main.js — Render del sitio, data-bindings, animaciones y SEO dinámico
 * ---------------------------------------------------------------------
 * Responsabilidades:
 *   1) Cargar la capa publicada (data/content.json) y fusionar con FFStore.
 *   2) Resolver data-bindings del HTML (data-text, data-href, data-bg, ...).
 *   3) Renderizar las secciones list-driven (stats, valores, galería,
 *      servicios, por qué, testimonios, FAQ, horario, navegación).
 *   4) Microinteracciones: reveal, count-up, scrollspy, navbar, menú móvil,
 *      acordeón FAQ, botones magnéticos, indicador "Abierto ahora".
 *   5) Generar el JSON-LD (@graph) desde el contenido.
 */
(function () {
  'use strict';

  /* ──────────────────────────  Utilidades base  ─────────────────────────── */

  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /** Devuelve un valor anidado por ruta "a.b.c". */
  function getPath(obj, path) {
    return path.split('.').reduce(function (acc, k) {
      return acc == null ? undefined : acc[k];
    }, obj);
  }

  /** Escapa texto para uso en HTML. */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────────────────────  Enlaces derivados  ────────────────────────── */

  function telHref(c) {
    var raw = (c.business.whatsapp || '').replace(/\D/g, '');
    return 'tel:+' + raw;
  }
  function whatsappHref(c) {
    var num = (c.business.whatsapp || '').replace(/\D/g, '');
    var msg = encodeURIComponent(c.business.whatsappMessage || '');
    return 'https://wa.me/' + num + (msg ? '?text=' + msg : '');
  }
  function mapsEmbed(c) {
    var q = encodeURIComponent(c.business.address + ', España');
    return 'https://maps.google.com/maps?q=' + q + '&z=16&output=embed';
  }
  function directionsHref(c) {
    var q = encodeURIComponent(c.business.address + ', España');
    return 'https://www.google.com/maps/dir/?api=1&destination=' + q;
  }

  /* ─────────────────────────────  Iconos SVG  ───────────────────────────── */
  // Biblioteca mínima de iconos (stroke = currentColor).
  var ICONS = {
    family: '<path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M2 21v-1a6 6 0 0 1 12 0v1M14 21v-1a5 5 0 0 1 8-4"/>',
    badge: '<path d="m12 2 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L3.2 7.7l5.4-.8L12 2Z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    physio: '<path d="M12 2v6M9 4h6"/><path d="M5 22c0-4 3-7 7-7s7 3 7 7"/><circle cx="12" cy="12" r="2.5"/>',
    dumbbell: '<path d="M6 5v14M3 8v8M18 5v14M21 8v8M6 12h12"/>',
    group: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 7-4"/>',
    whistle: '<path d="M16 9a5 5 0 1 1-5 5h-1l-7 2v-4l5-1V9a4 4 0 0 1 4-4h6"/><circle cx="16" cy="14" r="1"/>',
    bolt: '<path d="M13 2 4 14h7l-2 8 9-12h-7l2-8Z"/>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9 9a2.8 2.8 0 0 1-4-4l9-9Z"/><path d="m6 13 5 5"/>',
    tag: '<path d="M3 3h7l11 11-7 7L3 10V3Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  function icon(name, cls) {
    var p = ICONS[name] || ICONS.badge;
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' +
      (cls || '') +
      '">' +
      p +
      '</svg>'
    );
  }
  function stars(n) {
    var full = Math.round(n);
    var out = '';
    for (var i = 0; i < 5; i++) out += i < full ? '★' : '☆';
    return out;
  }

  /* ───────────────────────────  Data-bindings  ──────────────────────────── */

  function applyBindings(c) {
    // data-text → textContent
    $$('[data-text]').forEach(function (el) {
      var v = getPath(c, el.getAttribute('data-text'));
      if (v != null) el.textContent = v;
    });
    // data-href → enlaces directos del contenido
    $$('[data-href]').forEach(function (el) {
      var v = getPath(c, el.getAttribute('data-href'));
      if (v) el.setAttribute('href', v);
    });
    // data-bg → background-image (hero)
    $$('[data-bg]').forEach(function (el) {
      var v = getPath(c, el.getAttribute('data-bg'));
      if (v) el.style.backgroundImage = "url('" + v + "')";
    });
    // data-src → <img src> con carga blur→nítido
    $$('[data-src]').forEach(function (el) {
      var v = getPath(c, el.getAttribute('data-src'));
      if (v) setImage(el, v);
    });
    // Enlaces derivados (mismo valor en muchos sitios)
    $$('[data-tel]').forEach(function (el) {
      el.setAttribute('href', telHref(c));
    });
    $$('[data-whatsapp]').forEach(function (el) {
      el.setAttribute('href', whatsappHref(c));
    });
    $$('[data-directions]').forEach(function (el) {
      el.setAttribute('href', directionsHref(c));
    });
    $$('[data-address]').forEach(function (el) {
      el.textContent = c.business.address;
    });
  }

  /** Asigna imagen con efecto de carga elegante. */
  function setImage(img, src) {
    img.classList.add('img-fade');
    var done = function () {
      img.classList.add('loaded');
    };
    img.src = src;
    if (img.complete) done();
    else img.addEventListener('load', done, { once: true });
  }

  /* ──────────────────────────  Render de secciones  ─────────────────────── */

  function renderStats(c) {
    var grid = $('#stats-grid');
    if (!grid) return;
    grid.innerHTML = (c.stats || [])
      .map(function (s, i) {
        return (
          '<div class="reveal" style="--i:' + i + '">' +
          '<p class="font-display text-4xl sm:text-5xl text-brand-lime leading-none">' +
          '<span class="count" data-target="' + s.value + '" data-decimals="' + (s.decimals || 0) + '">0</span>' +
          '<span>' + esc(s.suffix || '') + '</span></p>' +
          '<p class="mt-2 text-sm text-brand-muted">' + esc(s.label) + '</p>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderAbout(c) {
    var box = $('#about-paragraphs');
    if (box) {
      box.innerHTML = (c.about.paragraphs || [])
        .map(function (p) {
          return '<p>' + esc(p) + '</p>';
        })
        .join('');
    }
    var grid = $('#values-grid');
    if (grid) {
      grid.innerHTML = (c.about.values || [])
        .map(function (v, i) {
          return (
            '<div class="card card-hover p-6 reveal" style="--i:' + i + '">' +
            '<span class="icon-chip">' + icon(v.icon) + '</span>' +
            '<h3 class="mt-4 font-heading uppercase tracking-wide text-lg">' + esc(v.title) + '</h3>' +
            '<p class="mt-2 text-sm text-brand-muted">' + esc(v.text) + '</p>' +
            '</div>'
          );
        })
        .join('');
    }
  }

  function renderGallery(c) {
    var grid = $('#gallery-grid');
    if (!grid) return;
    grid.innerHTML = (c.facilities.gallery || [])
      .map(function (g, i) {
        var big = i === 0 ? ' lg:col-span-2 lg:row-span-2' : '';
        return (
          '<figure class="gallery-item reveal aspect-square' + big + '" style="--i:' + (i % 6) + '">' +
          '<img data-lazy="' + esc(g.src) + '" alt="' + esc(g.alt || 'Instalación de Family Fitness') +
          '" width="600" height="600" loading="lazy" decoding="async" class="img-fade" />' +
          '</figure>'
        );
      })
      .join('');
    // Carga diferida con efecto fade
    $$('#gallery-grid img[data-lazy]').forEach(function (img) {
      setImage(img, img.getAttribute('data-lazy'));
    });
  }

  function renderServices(c) {
    var grid = $('#services-grid');
    if (!grid) return;
    grid.innerHTML = (c.services.items || [])
      .map(function (s, i) {
        var note = s.note
          ? '<span class="mt-4 inline-block text-xs font-heading uppercase tracking-wide px-3 py-1 rounded-full bg-brand-lime/15 text-brand-lime border border-brand-lime/30">' +
            esc(s.note) + '</span>'
          : '';
        return (
          '<article class="card card-hover p-7 reveal" style="--i:' + (i % 3) + '">' +
          '<span class="icon-chip">' + icon(s.icon) + '</span>' +
          '<h3 class="mt-5 font-heading uppercase tracking-wide text-xl">' + esc(s.title) + '</h3>' +
          '<p class="mt-2 text-brand-muted">' + esc(s.text) + '</p>' +
          note +
          '</article>'
        );
      })
      .join('');
  }

  function renderWhy(c) {
    var grid = $('#why-grid');
    if (!grid) return;
    grid.innerHTML = (c.why.items || [])
      .map(function (w, i) {
        return (
          '<div class="flex gap-4 reveal" style="--i:' + (i % 3) + '">' +
          '<span class="icon-chip shrink-0">' + icon(w.icon) + '</span>' +
          '<div><h3 class="font-heading uppercase tracking-wide text-lg">' + esc(w.title) + '</h3>' +
          '<p class="mt-1 text-sm text-brand-muted">' + esc(w.text) + '</p></div>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderTestimonials(c) {
    var grid = $('#testimonials-grid');
    if (!grid) return;
    grid.innerHTML = (c.testimonials.items || [])
      .map(function (t, i) {
        return (
          '<figure class="card card-hover p-7 reveal" style="--i:' + (i % 3) + '">' +
          '<div class="stars text-lg" aria-label="' + t.rating + ' de 5">' + esc(stars(t.rating)) + '</div>' +
          '<blockquote class="mt-4 text-gray-200">“' + esc(t.text) + '”</blockquote>' +
          '<figcaption class="mt-5 font-heading uppercase tracking-wide text-sm text-brand-muted">— ' + esc(t.name) + '</figcaption>' +
          '</figure>'
        );
      })
      .join('');
  }

  function renderPromo(c) {
    var band = $('#promo');
    var pill = $('[data-promo-pill]');
    var p = c.promo || {};
    var on = p.enabled !== false;
    if (band) {
      if (on) band.removeAttribute('hidden');
      else band.setAttribute('hidden', '');
    }
    if (pill) pill.style.display = on ? '' : 'none';
  }

  function renderClasses(c) {
    var grid = $('#classes-grid');
    if (!grid) return;
    var days = (c.classes && c.classes.days) || [];
    grid.innerHTML = days
      .map(function (d, i) {
        var rows = (d.sessions || [])
          .map(function (s) {
            return (
              '<li class="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">' +
              '<span class="font-heading text-brand-lime tabular-nums">' + esc(s.time) + '</span>' +
              '<span class="text-gray-200">' + esc(s.name) + '</span>' +
              '</li>'
            );
          })
          .join('');
        return (
          '<div class="card card-hover p-6 reveal" style="--i:' + i + '">' +
          '<h3 class="font-heading uppercase tracking-wide text-xl text-brand-lime">' + esc(d.days) + '</h3>' +
          '<ul class="mt-3">' + rows + '</ul>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderFaq(c) {
    var list = $('#faq-list');
    if (!list) return;
    list.innerHTML = (c.faq.items || [])
      .map(function (f, i) {
        var id = 'faq-' + i;
        return (
          '<div class="faq-item reveal" style="--i:' + (i % 4) + '">' +
          '<button class="faq-question" aria-expanded="false" aria-controls="' + id + '">' +
          '<span>' + esc(f.q) + '</span>' +
          '<svg class="chev w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>' +
          '</button>' +
          '<div class="faq-answer" id="' + id + '" role="region"><div>' + esc(f.a) + '</div></div>' +
          '</div>'
        );
      })
      .join('');
    initFaq();
  }

  function renderSchedule(c) {
    var human = c.business.scheduleHuman || [];
    var list = $('#schedule-list');
    if (list) {
      list.innerHTML = human
        .map(function (h) {
          var off = /cerrado/i.test(h.value) ? ' text-brand-orange' : '';
          return '<li class="flex justify-between gap-6"><span>' + esc(h.label) + '</span><span class="' + off + '">' + esc(h.value) + '</span></li>';
        })
        .join('');
    }
    var fs = $('#footer-schedule');
    if (fs) {
      fs.innerHTML = human
        .map(function (h) {
          return '<li>' + esc(h.label) + ': ' + esc(h.value) + '</li>';
        })
        .join('');
    }
  }

  function renderFooterNav(c) {
    var nav = $('#footer-nav');
    if (!nav) return;
    nav.innerHTML = (c.footer.nav || [])
      .map(function (n) {
        return '<li><a href="' + esc(n.href) + '" class="footer-link">' + esc(n.label) + '</a></li>';
      })
      .join('');
  }

  function renderMap(c) {
    var iframe = $('#map-embed');
    if (iframe) iframe.src = mapsEmbed(c);
  }

  function renderContactForm(c) {
    var form = $('#contact-form');
    if (!form) return;
    var cfg = (c.contact && c.contact.form) || {};
    if (!cfg.enabled) {
      form.classList.add('hidden');
      return;
    }
    form.classList.remove('hidden');
    if (cfg.action) form.setAttribute('action', cfg.action);

    if (form.dataset.bound) return; // evita doble listener en re-render
    form.dataset.bound = '1';
    form.addEventListener('submit', function (e) {
      var status = $('#form-status');
      // Sin endpoint configurado: caer a WhatsApp con los datos.
      if (!cfg.action) {
        e.preventDefault();
        var data = new FormData(form);
        var txt =
          'Hola Family Fitness 💪, soy ' + (data.get('nombre') || '') +
          ' (tel: ' + (data.get('telefono') || '') + '). ' + (data.get('mensaje') || '');
        window.open('https://wa.me/' + (c.business.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(txt), '_blank');
        if (status) status.textContent = 'Te redirigimos a WhatsApp para completar el envío.';
        return;
      }
      // Con Formspree: envío AJAX para no salir de la página.
      if (cfg.provider === 'formspree') {
        e.preventDefault();
        if (status) {
          status.className = 'text-sm text-brand-muted';
          status.textContent = 'Enviando…';
        }
        fetch(cfg.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (r.ok) {
              form.reset();
              if (status) {
                status.className = 'text-sm text-brand-lime';
                status.textContent = '¡Gracias! Te llamaremos lo antes posible.';
              }
            } else throw new Error('error');
          })
          .catch(function () {
            if (status) {
              status.className = 'text-sm text-brand-orange';
              status.textContent = 'No se pudo enviar. Llámanos o escríbenos por WhatsApp.';
            }
          });
      }
      // Otros proveedores: envío nativo del formulario.
    });
  }

  /* ──────────────────────  Indicador "Abierto ahora"  ───────────────────── */

  function toMin(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  /** Calcula el estado de apertura desde business.schedule. */
  function openState(schedule) {
    var now = new Date();
    var day = now.getDay(); // 0..6
    var mins = now.getHours() * 60 + now.getMinutes();
    var todays = (schedule || []).filter(function (s) {
      return s.days.indexOf(day) !== -1;
    });
    for (var i = 0; i < todays.length; i++) {
      var s = todays[i];
      if (mins >= toMin(s.open) && mins < toMin(s.close)) {
        return { open: true, text: 'Abierto ahora · cierra ' + s.close };
      }
    }
    // Cerrado: buscar próxima apertura (hoy más tarde o siguientes días).
    var next = nextOpening(schedule, day, mins);
    return { open: false, text: next ? 'Cerrado · abre ' + next : 'Cerrado ahora' };
  }

  function nextOpening(schedule, day, mins) {
    var dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (var offset = 0; offset < 7; offset++) {
      var d = (day + offset) % 7;
      var slots = (schedule || [])
        .filter(function (s) { return s.days.indexOf(d) !== -1; })
        .sort(function (a, b) { return toMin(a.open) - toMin(b.open); });
      for (var i = 0; i < slots.length; i++) {
        if (offset === 0 && toMin(slots[i].open) <= mins) continue;
        return (offset === 0 ? 'hoy a las ' : offset === 1 ? 'mañana a las ' : dayNames[d] + ' a las ') + slots[i].open;
      }
    }
    return null;
  }

  function updateOpenBadges(c) {
    var st = openState(c.business.schedule);
    $$('[data-open-badge]').forEach(function (el) {
      el.classList.remove('is-open', 'is-closed', 'is-loading');
      el.classList.add(st.open ? 'is-open' : 'is-closed');
      var txt = el.querySelector('[data-open-text]');
      if (txt) txt.textContent = st.text;
    });
  }

  /* ────────────────────────────  Count-up  ──────────────────────────────── */

  function countUp(el) {
    if (el.dataset.counted) return; // evita doble disparo (dos observers)
    el.dataset.counted = '1';
    var target = parseFloat(el.getAttribute('data-target')) || 0;
    var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    var start = performance.now();
    var dur = 1400;
    function tick(t) {
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(tick);
  }

  /* ─────────────────────────  Reveal + count-up  ────────────────────────── */

  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (e) { e.classList.add('is-visible'); });
      $$('.count').forEach(countUp);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            $$('.count', en.target).forEach(countUp);
            if (en.target.classList.contains('count')) countUp(en.target);
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach(function (e) { io.observe(e); });
    // Observa también las cifras directamente (por si no llevan .reveal padre).
    var ioCount = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          countUp(en.target);
          ioCount.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    $$('.count').forEach(function (e) { ioCount.observe(e); });
  }

  /* ───────────────────────────  FAQ acordeón  ───────────────────────────── */

  function initFaq() {
    $$('.faq-question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        btn.setAttribute('aria-expanded', String(!expanded));
        panel.style.maxHeight = expanded ? null : panel.scrollHeight + 'px';
      });
    });
  }

  /* ───────────────────────────  Navbar / menú  ──────────────────────────── */

  function initNavbar() {
    var navbar = $('#navbar');
    var onScroll = function () {
      navbar.classList.toggle('scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var burger = $('#hamburger');
    var menu = $('#mobile-menu');
    var backdrop = $('#menu-backdrop');
    function setMenu(open) {
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('open', open);
      menu.setAttribute('aria-hidden', String(!open));
      backdrop.style.opacity = open ? '1' : '0';
      backdrop.style.pointerEvents = open ? 'auto' : 'none';
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });
    backdrop.addEventListener('click', function () { setMenu(false); });
    $$('.mobile-link').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ─────────────────────────────  Scrollspy  ────────────────────────────── */

  function initScrollspy() {
    var sections = $$('main section[id]');
    var links = $$('#nav-links a');
    if (!sections.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (a) {
      byId[a.getAttribute('href').slice(1)] = a;
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            links.forEach(function (l) { l.classList.remove('active'); });
            var link = byId[en.target.id];
            if (link) link.classList.add('active');
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ──────────────────────────  Botones magnéticos  ──────────────────────── */

  function initMagnetic() {
    if (reduceMotion || !window.matchMedia('(pointer:fine)').matches) return;
    $$('.btn-primary, .fab').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + x * 0.18 + 'px,' + (y * 0.18 - 2) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ──────────────────────────────  JSON-LD  ─────────────────────────────── */

  function dayName(d) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
  }

  function buildJsonLd(c) {
    var b = c.business;
    var url = b.url || location.origin + '/';
    var img = url.replace(/\/$/, '') + '/' + (c.images.og || c.images.hero);

    var opening = (b.schedule || []).map(function (s) {
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: s.days.map(dayName),
        opens: s.open,
        closes: s.close,
      };
    });

    var offers = (c.services.items || []).map(function (s) {
      return { '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, description: s.text } };
    });

    var graph = [
      {
        '@type': ['HealthClub', 'SportsActivityLocation', 'LocalBusiness'],
        '@id': url + '#gym',
        name: b.name,
        legalName: b.legalName,
        description: c.seo.description,
        image: img,
        url: url,
        telephone: '+' + (b.whatsapp || '').replace(/\D/g, ''),
        priceRange: b.priceRange,
        address: {
          '@type': 'PostalAddress',
          streetAddress: b.address.split(',')[0],
          addressLocality: b.addressLocality,
          postalCode: b.postalCode,
          addressRegion: b.addressRegion,
          addressCountry: b.country,
        },
        geo: { '@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng },
        hasMap: directionsHref(c),
        areaServed: (b.areaServed || []).map(function (a) {
          return { '@type': 'Place', name: a };
        }),
        openingHoursSpecification: opening,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: b.rating,
          reviewCount: b.reviewCount,
          bestRating: 5,
        },
        makesOffer: offers,
        sameAs: [b.instagram].filter(Boolean),
        founder: { '@type': 'Organization', name: b.legalName },
        potentialAction: {
          '@type': 'ReserveAction',
          target: url + '#contacto',
          name: 'Hazte socio',
        },
      },
      {
        '@type': 'WebSite',
        '@id': url + '#website',
        url: url,
        name: b.name,
        inLanguage: 'es-ES',
        publisher: { '@id': url + '#gym' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': url + '#breadcrumb',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: url },
          { '@type': 'ListItem', position: 2, name: 'Gimnasio en Sevilla', item: url + '#sobre-nosotros' },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': url + '#faq',
        mainEntity: (c.faq.items || []).map(function (f) {
          return {
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          };
        }),
      },
    ];

    var json = { '@context': 'https://schema.org', '@graph': graph };
    var prev = document.getElementById('jsonld');
    if (prev) prev.remove();
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'jsonld';
    s.textContent = JSON.stringify(json);
    document.head.appendChild(s);
  }

  /* ─────────────────────────────  Render todo  ──────────────────────────── */

  function renderAll(c) {
    document.title = c.seo.title || document.title;
    applyBindings(c);
    renderStats(c);
    renderAbout(c);
    renderGallery(c);
    renderServices(c);
    renderPromo(c);
    renderClasses(c);
    renderWhy(c);
    renderTestimonials(c);
    renderFaq(c);
    renderSchedule(c);
    renderFooterNav(c);
    renderMap(c);
    renderContactForm(c);
    updateOpenBadges(c);
    buildJsonLd(c);

    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();

    // Inicializa interacciones tras inyectar el DOM.
    initReveal();
    initScrollspy();
    initMagnetic();

    // Refresca el indicador de apertura cada minuto.
    clearInterval(window.__ffOpenTimer);
    window.__ffOpenTimer = setInterval(function () { updateOpenBadges(c); }, 60000);
  }

  /* ────────────────────────────  Arranque  ──────────────────────────────── */

  function boot() {
    initNavbar();
    // 1) Render inicial con defaults + overrides (sin esperar a la red).
    renderAll(window.FFStore.getContent());

    // 2) Carga la capa publicada y re-renderiza si aporta cambios.
    fetch('data/content.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (published) {
        if (published && Object.keys(published).length) {
          window.FFStore.setPublished(published);
          renderAll(window.FFStore.getContent());
        }
      })
      .catch(function () { /* sin content.json: seguimos con defaults */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
