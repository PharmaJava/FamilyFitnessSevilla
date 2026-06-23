/**
 * github.js — Publicación directa a GitHub (window.FFGitHub)
 * ---------------------------------------------------------
 * Usa la GitHub Contents API con un fine-grained token guardado en el
 * navegador (localStorage). Permite:
 *   · Probar la conexión (repo + token).
 *   · Subir imágenes nuevas (data-URL) como archivos reales a assets/img/.
 *   · Escribir data/content.json (resolviendo el `sha` previo).
 *
 * ⚠️ Seguridad: el token vive en el navegador. Usa un token con permiso
 * mínimo (Contents: Read and write) y limitado a este repositorio. Si se
 * filtra, revócalo desde GitHub.
 *
 * API:
 *   FFGitHub.getSettings()            → {owner, repo, branch, token}
 *   FFGitHub.saveSettings(obj)        → persiste owner/repo/branch/token
 *   FFGitHub.test()                   → Promise<{ok, message}>
 *   FFGitHub.getFileSha(path)         → Promise<sha|null>
 *   FFGitHub.putFile(path, b64, msg)  → Promise (create/update)
 *   FFGitHub.publish(content, imgs, onLog) → Promise<resumen>
 */
(function () {
  'use strict';

  var API = 'https://api.github.com';

  /* ──────────────────────────  Codificación  ───────────────────────────── */

  /** UTF-8 → base64 (texto, p.ej. JSON con acentos/emoji). */
  function b64EncodeUnicode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }

  /** Extrae la parte base64 de un data-URL (imágenes). */
  function dataUrlToBase64(dataUrl) {
    var i = dataUrl.indexOf(',');
    return i === -1 ? dataUrl : dataUrl.slice(i + 1);
  }

  /* ────────────────────────────  Ajustes  ──────────────────────────────── */

  function defaults() {
    var g = (window.FF_CONFIG && window.FF_CONFIG.github) || {};
    return { owner: g.owner || '', repo: g.repo || '', branch: g.branch || 'main', token: '' };
  }

  function getSettings() {
    var saved = window.FFStore ? window.FFStore.getGitHub() : {};
    var d = defaults();
    return {
      owner: saved.owner || d.owner,
      repo: saved.repo || d.repo,
      branch: saved.branch || d.branch,
      token: saved.token || '',
    };
  }

  function saveSettings(obj) {
    if (window.FFStore) window.FFStore.setGitHub(obj || {});
    return getSettings();
  }

  function headers(token) {
    return {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  function repoBase(s) {
    return API + '/repos/' + s.owner + '/' + s.repo + '/contents/';
  }

  /* ─────────────────────────────  Llamadas  ─────────────────────────────── */

  /** Devuelve el sha de un archivo si existe, o null si no existe (404). */
  function getFileSha(path) {
    var s = getSettings();
    var url = repoBase(s) + encodeURI(path) + '?ref=' + encodeURIComponent(s.branch);
    return fetch(url, { headers: headers(s.token) }).then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('No se pudo consultar ' + path + ' (' + r.status + ')');
      return r.json().then(function (j) { return j.sha; });
    });
  }

  /** Crea o actualiza un archivo (contenido ya en base64). */
  function putFile(path, contentB64, message) {
    var s = getSettings();
    return getFileSha(path).then(function (sha) {
      var body = {
        message: message || ('Actualiza ' + path),
        content: contentB64,
        branch: s.branch,
      };
      if (sha) body.sha = sha;
      return fetch(repoBase(s) + encodeURI(path), {
        method: 'PUT',
        headers: headers(s.token),
        body: JSON.stringify(body),
      }).then(function (r) {
        if (!r.ok) {
          return r.json().then(function (j) {
            throw new Error('Error al subir ' + path + ': ' + (j.message || r.status));
          });
        }
        return r.json();
      });
    });
  }

  /** Prueba la conexión: comprueba acceso al repositorio. */
  function test() {
    var s = getSettings();
    if (!s.owner || !s.repo) return Promise.resolve({ ok: false, message: 'Falta owner o repo.' });
    if (!s.token) return Promise.resolve({ ok: false, message: 'Falta el token.' });
    return fetch(API + '/repos/' + s.owner + '/' + s.repo, { headers: headers(s.token) })
      .then(function (r) {
        if (r.status === 401) return { ok: false, message: 'Token inválido o caducado (401).' };
        if (r.status === 403) return { ok: false, message: 'Sin permisos suficientes (403). Revisa Contents: Read and write.' };
        if (r.status === 404) return { ok: false, message: 'Repositorio no encontrado o token sin acceso (404).' };
        if (!r.ok) return { ok: false, message: 'Error ' + r.status + '.' };
        return r.json().then(function (j) {
          return { ok: true, message: 'Conectado a ' + j.full_name + ' (rama ' + s.branch + ').' };
        });
      })
      .catch(function (e) { return { ok: false, message: 'Error de red: ' + e.message }; });
  }

  /* ─────────────────────────────  Publicar  ─────────────────────────────── */

  /**
   * publish(content, images, onLog)
   *   content → objeto de contenido a escribir en data/content.json.
   *   images  → array de {name, dataUrl} a subir a assets/img/.
   *   onLog   → callback(texto) para reportar progreso.
   * Devuelve un resumen { content, images }.
   */
  function publish(content, images, onLog) {
    var s = getSettings();
    var g = (window.FF_CONFIG && window.FF_CONFIG.github) || {};
    var contentPath = g.contentPath || 'data/content.json';
    var imgDir = (g.imgDir || 'assets/img').replace(/\/$/, '');
    var log = onLog || function () {};

    if (!s.token) return Promise.reject(new Error('Configura el token de GitHub antes de publicar.'));

    var queue = (images || []).slice();
    var uploaded = [];

    // 1) Subir imágenes en serie (evita golpear el rate-limit).
    function uploadNext() {
      if (!queue.length) return Promise.resolve();
      var img = queue.shift();
      var path = imgDir + '/' + img.name;
      log('Subiendo imagen ' + img.name + '…');
      return putFile(path, dataUrlToBase64(img.dataUrl), 'Sube imagen ' + img.name + ' desde el panel')
        .then(function () {
          uploaded.push(path);
          return uploadNext();
        });
    }

    // 2) Escribir content.json.
    return uploadNext().then(function () {
      log('Publicando contenido (content.json)…');
      var json = JSON.stringify(content, null, 2);
      return putFile(contentPath, b64EncodeUnicode(json), 'Actualiza contenido del sitio desde el panel').then(function () {
        log('✅ Publicado. El hosting redesplegará en unos segundos.');
        return { content: contentPath, images: uploaded };
      });
    });
  }

  window.FFGitHub = {
    getSettings: getSettings,
    saveSettings: saveSettings,
    test: test,
    getFileSha: getFileSha,
    putFile: putFile,
    publish: publish,
    _b64: b64EncodeUnicode,
  };
})();
