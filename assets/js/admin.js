/**
 * admin.js — Lógica del panel de administración (Family Fitness)
 * -------------------------------------------------------------
 * Funciones:
 *   · Login por código (SHA-256 con crypto.subtle) y sesión en sessionStorage.
 *   · Edición de datos del negocio (formularios → overrides en localStorage).
 *   · Gestión de imágenes (subida, redimensionado en <canvas>, URL, borrado).
 *   · Conexión con GitHub (guardar/probar) y publicación a la web.
 *   · Copia de seguridad (exportar/importar/restablecer) y uso de almacenamiento.
 *   · Cambio del código de acceso.
 */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var SESSION_KEY = 'ff:admin-auth';
  var MAX_DIM = 1280; // px máximo del lado mayor al redimensionar
  var JPEG_Q = 0.82; // calidad JPEG

  /* ─────────────────────────────  Helpers  ──────────────────────────────── */

  function getPath(obj, path) {
    return path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, obj);
  }
  function setPath(obj, path, value) {
    var keys = path.split('.');
    var cur = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] == null) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    return obj;
  }

  async function sha256(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.prototype.map
      .call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  function toast(msg, type) {
    var wrap = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'all .3s';
      setTimeout(function () { el.remove(); }, 320);
    }, 3600);
  }

  /** Redimensiona una imagen (File o dataURL) a JPEG con MAX_DIM/JPEG_Q. */
  function resizeImage(srcDataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, MAX_DIM / Math.max(w, h));
        var cw = Math.round(w * scale), ch = Math.round(h * scale);
        var canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve(canvas.toDataURL('image/jpeg', JPEG_Q));
      };
      img.onerror = function () { reject(new Error('No se pudo cargar la imagen')); };
      img.crossOrigin = 'anonymous';
      img.src = srcDataUrl;
    });
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function markDirty() {
    $('#draft-note').classList.remove('hidden');
  }

  /* ────────────────────────────────  Login  ─────────────────────────────── */

  function isAuthed() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }
  function showPanel() {
    $('#login').classList.add('hidden');
    $('#panel').classList.remove('hidden');
    initPanel();
  }

  async function handleLogin(e) {
    e.preventDefault();
    var code = $('#access-code').value;
    var hash = await sha256(code);
    var expected = (window.FFStore.getAccessHash() || (window.FF_CONFIG.admin && window.FF_CONFIG.admin.accessHash));
    if (hash === expected) {
      sessionStorage.setItem(SESSION_KEY, '1');
      showPanel();
    } else {
      $('#login-error').classList.remove('hidden');
    }
  }

  /* ──────────────────────────  Formulario negocio  ──────────────────────── */

  function loadForm() {
    var c = window.FFStore.getContent();
    $$('[data-bind]').forEach(function (el) {
      var v = getPath(c, el.getAttribute('data-bind'));
      if (v != null) el.value = v;
    });
    // Previews de imágenes
    $('#hero-preview').src = c.images.hero || '';
    $('#about-preview').src = c.images.about || '';
    renderThumbs();
  }

  function saveBusiness() {
    var patch = {};
    $$('[data-bind]').forEach(function (el) {
      var path = el.getAttribute('data-bind');
      var val = el.value;
      if (el.getAttribute('data-type') === 'number') val = parseFloat(val) || 0;
      setPath(patch, path, val);
    });
    window.FFStore.patchContent(patch);
    markDirty();
    toast('Cambios guardados (sin publicar).');
  }

  /* ───────────────────────────  Imágenes únicas  ────────────────────────── */

  async function setSingleImage(key, dataUrl) {
    var resized = await resizeImage(dataUrl);
    var patch = {};
    setPath(patch, 'images.' + key, resized);
    window.FFStore.patchContent(patch);
    $('#' + key + '-preview').src = resized;
    markDirty();
    toast('Imagen actualizada (sin publicar).');
  }

  /* ────────────────────────────  Galería  ───────────────────────────────── */

  function currentGallery() {
    var c = window.FFStore.getContent();
    return (c.facilities && c.facilities.gallery ? c.facilities.gallery : []).slice();
  }
  function saveGallery(gallery) {
    window.FFStore.patchContent({ facilities: { gallery: gallery } });
    renderThumbs();
    markDirty();
  }

  function renderThumbs() {
    var gallery = currentGallery();
    var box = $('#thumbs');
    box.innerHTML = gallery
      .map(function (g, i) {
        var isNew = /^data:/.test(g.src);
        return (
          '<div class="thumb">' +
          '<img src="' + g.src + '" alt="' + (g.alt || '') + '" />' +
          (isNew ? '<span class="badge-new">nuevo</span>' : '') +
          '<button class="del" data-i="' + i + '" title="Eliminar">✕</button>' +
          '</div>'
        );
      })
      .join('');
    $$('#thumbs .del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-i'), 10);
        var g = currentGallery();
        g.splice(i, 1);
        saveGallery(g);
        toast('Imagen eliminada.');
      });
    });
  }

  async function addGalleryImages(dataUrls) {
    var g = currentGallery();
    for (var i = 0; i < dataUrls.length; i++) {
      var resized = await resizeImage(dataUrls[i]);
      g.push({ src: resized, alt: 'Instalación de Family Fitness Sevilla' });
    }
    saveGallery(g);
    toast(dataUrls.length + ' imagen(es) añadida(s).');
  }

  /* ─────────────────────────  Conexión GitHub  ──────────────────────────── */

  function loadGitHub() {
    var s = window.FFGitHub.getSettings();
    $('#gh-owner').value = s.owner;
    $('#gh-repo').value = s.repo;
    $('#gh-branch').value = s.branch;
    $('#gh-token').value = s.token;
  }
  function saveGitHub() {
    window.FFGitHub.saveSettings({
      owner: $('#gh-owner').value.trim(),
      repo: $('#gh-repo').value.trim(),
      branch: $('#gh-branch').value.trim() || 'main',
      token: $('#gh-token').value.trim(),
    });
    toast('Conexión guardada.');
  }
  function setGhStatus(ok, msg) {
    var pill = $('#gh-status');
    pill.className = 'status-pill ' + (ok ? 'ok' : 'ko');
    pill.innerHTML = '<span class="d"></span> ' + msg;
  }
  function testGitHub() {
    saveGitHub();
    setGhStatus(false, 'Probando…');
    window.FFGitHub.test().then(function (res) {
      setGhStatus(res.ok, res.message);
      toast(res.message, res.ok ? '' : 'err');
    });
  }

  /* ─────────────────────────────  Publicar  ─────────────────────────────── */

  /**
   * Prepara el contenido para publicar: extrae las imágenes data-URL,
   * les asigna nombre de archivo real y las sustituye en el contenido.
   */
  function prepareForPublish() {
    var content = window.FFStore._clone(window.FFStore.getContent());
    var images = [];
    var stamp = Date.now();
    var n = 0;

    function handle(dataUrl) {
      var name = 'ff-' + stamp + '-' + n++ + '.jpg';
      images.push({ name: name, dataUrl: dataUrl });
      return (window.FF_CONFIG.github.imgDir || 'assets/img').replace(/\/$/, '') + '/' + name;
    }

    // Imágenes únicas
    ['hero', 'about'].forEach(function (k) {
      if (content.images && /^data:/.test(content.images[k] || '')) {
        content.images[k] = handle(content.images[k]);
      }
    });
    // Galería
    if (content.facilities && content.facilities.gallery) {
      content.facilities.gallery.forEach(function (g) {
        if (/^data:/.test(g.src || '')) g.src = handle(g.src);
      });
    }
    return { content: content, images: images };
  }

  function publish() {
    var s = window.FFGitHub.getSettings();
    if (!s.token) {
      toast('Configura y guarda el token de GitHub primero.', 'err');
      return;
    }
    var btn = $('#btn-publish');
    var logBox = $('#publish-log');
    logBox.classList.remove('hidden');
    logBox.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Publicando…';

    var log = function (t) { logBox.textContent += t + '\n'; logBox.scrollTop = logBox.scrollHeight; };
    var prepared = prepareForPublish();

    window.FFGitHub
      .publish(prepared.content, prepared.images, log)
      .then(function () {
        // Sincroniza el estado local con lo publicado:
        // el contenido ya apunta a rutas reales → fija como "publicado"
        // y reemplaza los overrides para no re-subir data-URLs.
        window.FFStore.setPublished(prepared.content);
        window.FFStore.resetOverrides();
        $('#draft-note').classList.add('hidden');
        loadForm();
        updateUsage();
        toast('✅ ¡Publicado! Estará online en unos segundos.');
      })
      .catch(function (e) {
        log('❌ ' + e.message);
        toast('Error al publicar: ' + e.message, 'err');
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = '🚀 Publicar en la web';
      });
  }

  /* ──────────────────────────  Copia de seguridad  ──────────────────────── */

  function exportBackup() {
    var data = {
      _meta: { app: 'Family Fitness', exported: new Date().toISOString() },
      overrides: window.FFStore.getOverrides(),
      github: (function () { var g = window.FFStore.getGitHub(); delete g.token; return g; })(),
      accessHash: window.FFStore.getAccessHash(),
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'family-fitness-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Copia exportada.');
  }

  function importBackup(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        if (data.overrides) window.FFStore.setOverrides(data.overrides);
        if (data.accessHash) window.FFStore.setAccessHash(data.accessHash);
        if (data.github) {
          var cur = window.FFStore.getGitHub();
          window.FFStore.setGitHub(Object.assign({}, data.github, { token: cur.token }));
        }
        loadForm();
        loadGitHub();
        updateUsage();
        markDirty();
        toast('Copia importada correctamente.');
      } catch (e) {
        toast('Archivo de copia no válido.', 'err');
      }
    };
    r.readAsText(file);
  }

  function resetAll() {
    if (!confirm('¿Restablecer a los valores por defecto? Se perderán los cambios locales sin publicar.')) return;
    window.FFStore.resetOverrides();
    $('#draft-note').classList.add('hidden');
    loadForm();
    updateUsage();
    toast('Restablecido a valores por defecto.');
  }

  function updateUsage() {
    var kb = window.FFStore.usageKB();
    $('#usage-kb').textContent = kb;
    // localStorage ~5MB → barra relativa a 5120 KB
    var pct = Math.min(100, (kb / 5120) * 100);
    $('#usage-fill').style.width = pct.toFixed(1) + '%';
  }

  /* ───────────────────────────  Código acceso  ──────────────────────────── */

  async function changeAccessCode() {
    var a = $('#ac-new').value, b = $('#ac-confirm').value;
    if (!a || a.length < 4) { toast('El código debe tener al menos 4 caracteres.', 'warn'); return; }
    if (a !== b) { toast('Los códigos no coinciden.', 'err'); return; }
    var hash = await sha256(a);
    window.FFStore.setAccessHash(hash);
    $('#ac-new').value = ''; $('#ac-confirm').value = '';
    toast('Código de acceso actualizado.');
  }

  /* ────────────────────────────  Inicialización  ────────────────────────── */

  function initPanel() {
    loadForm();
    loadGitHub();
    updateUsage();

    // Negocio
    $('#btn-save-biz').addEventListener('click', saveBusiness);

    // Imágenes únicas
    $('#hero-file').addEventListener('change', function (e) {
      if (e.target.files[0]) fileToDataUrl(e.target.files[0]).then(function (d) { setSingleImage('hero', d); });
    });
    $('#about-file').addEventListener('change', function (e) {
      if (e.target.files[0]) fileToDataUrl(e.target.files[0]).then(function (d) { setSingleImage('about', d); });
    });
    $('#hero-url').addEventListener('click', function () {
      var u = prompt('URL de la imagen de portada:');
      if (u) setSingleImage('hero', u);
    });
    $('#about-url').addEventListener('click', function () {
      var u = prompt('URL de la imagen "Sobre nosotros":');
      if (u) setSingleImage('about', u);
    });

    // Galería: dropzone
    var dz = $('#dropzone');
    var gf = $('#gallery-file');
    dz.addEventListener('click', function () { gf.click(); });
    dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', function () { dz.classList.remove('dragover'); });
    dz.addEventListener('drop', function (e) {
      e.preventDefault();
      dz.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });
    gf.addEventListener('change', function (e) { handleFiles(e.target.files); });
    $('#gallery-url').addEventListener('click', function () {
      var u = prompt('URL de la imagen para la galería:');
      if (u) addGalleryImages([u]);
    });

    function handleFiles(fileList) {
      var files = Array.prototype.slice.call(fileList).filter(function (f) { return /^image\//.test(f.type); });
      if (!files.length) return;
      Promise.all(files.map(fileToDataUrl)).then(addGalleryImages);
    }

    // GitHub
    $('#gh-save').addEventListener('click', saveGitHub);
    $('#gh-test').addEventListener('click', testGitHub);

    // Publicar
    $('#btn-publish').addEventListener('click', publish);
    $('#btn-preview').addEventListener('click', function () { window.open('index.html', '_blank'); });

    // Backup
    $('#bk-export').addEventListener('click', exportBackup);
    $('#bk-import').addEventListener('change', function (e) { if (e.target.files[0]) importBackup(e.target.files[0]); });
    $('#bk-reset').addEventListener('click', resetAll);

    // Código de acceso
    $('#ac-save').addEventListener('click', changeAccessCode);

    // Logout
    $('#btn-logout').addEventListener('click', function () {
      sessionStorage.removeItem(SESSION_KEY);
      location.reload();
    });
  }

  /* ───────────────────────────────  Arranque  ───────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    $('#login-form').addEventListener('submit', handleLogin);
    if (isAuthed()) showPanel();
    else $('#access-code').focus();
  });
})();
