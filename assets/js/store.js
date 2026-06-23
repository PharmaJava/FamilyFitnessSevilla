/**
 * store.js — Capa de almacenamiento y fusión de contenido (window.FFStore)
 * ------------------------------------------------------------------------
 * Wrapper de localStorage con espacio de nombres y la lógica de cascada que
 * combina: defaults (config.js) → publicado (data/content.json) → borrador
 * local (localStorage).
 *
 * Reglas de fusión:
 *   - Fusión PROFUNDA para objetos.
 *   - Los ARRAYS se REEMPLAZAN por completo (no se concatenan).
 *
 * API pública (window.FFStore):
 *   getContent()        → objeto de contenido fusionado y listo para render.
 *   getOverrides()      → borrador local (capa de localStorage).
 *   setOverrides(obj)   → reemplaza el borrador local.
 *   patchContent(patch) → fusiona un parche en el borrador local.
 *   resetOverrides()    → borra el borrador local.
 *   setPublished(obj)   → fija en memoria la capa publicada (la carga main.js).
 *   getPublished()      → capa publicada en memoria.
 *   usageKB()           → uso aproximado de localStorage (KB).
 *   key(name)           → clave namespaced.
 */
(function () {
  'use strict';

  var NS = 'ff:'; // espacio de nombres
  var K_OVERRIDES = NS + 'overrides'; // borrador local de contenido
  var K_ACCESS = NS + 'accessHash'; // hash del código de acceso (si se cambia)
  var K_GH = NS + 'github'; // credenciales/ajustes de GitHub

  // Capa "publicada" en memoria (se rellena al cargar data/content.json).
  var published = {};

  /* ───────────────────────────  Utilidades  ──────────────────────────── */

  function isObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  /** Clona en profundidad (estructuras JSON-serializables). */
  function clone(v) {
    return v == null ? v : JSON.parse(JSON.stringify(v));
  }

  /**
   * Fusión profunda: los objetos se combinan, los arrays se reemplazan.
   * Devuelve un objeto nuevo (no muta los argumentos).
   */
  function deepMerge(base, over) {
    if (!isObject(base)) return clone(over);
    if (!isObject(over)) return over === undefined ? clone(base) : clone(over);
    var out = clone(base);
    Object.keys(over).forEach(function (k) {
      var bv = out[k];
      var ov = over[k];
      if (isObject(bv) && isObject(ov)) {
        out[k] = deepMerge(bv, ov);
      } else {
        out[k] = clone(ov); // arrays y primitivos: reemplazo directo
      }
    });
    return out;
  }

  /* ─────────────────────────  Acceso a storage  ──────────────────────── */

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : (fallback !== undefined ? fallback : null);
    } catch (e) {
      console.warn('[FFStore] No se pudo leer', key, e);
      return fallback !== undefined ? fallback : null;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[FFStore] No se pudo guardar', key, e);
      return false;
    }
  }

  /* ─────────────────────────────  API  ───────────────────────────────── */

  var FFStore = {
    NS: NS,
    keys: { overrides: K_OVERRIDES, access: K_ACCESS, github: K_GH },

    key: function (name) {
      return NS + name;
    },

    // ── Capa publicada (data/content.json), en memoria ──
    setPublished: function (obj) {
      published = isObject(obj) ? clone(obj) : {};
      return published;
    },
    getPublished: function () {
      return clone(published);
    },

    // ── Borrador local (localStorage) ──
    getOverrides: function () {
      return readJSON(K_OVERRIDES, {}) || {};
    },
    setOverrides: function (obj) {
      return writeJSON(K_OVERRIDES, isObject(obj) ? obj : {});
    },
    patchContent: function (patch) {
      var current = this.getOverrides();
      var merged = deepMerge(current, patch || {});
      this.setOverrides(merged);
      return merged;
    },
    resetOverrides: function () {
      try {
        localStorage.removeItem(K_OVERRIDES);
      } catch (e) {}
      return {};
    },

    // ── Hash del código de acceso (override opcional) ──
    getAccessHash: function () {
      return readJSON(K_ACCESS, null);
    },
    setAccessHash: function (hash) {
      return writeJSON(K_ACCESS, hash);
    },

    // ── Ajustes de GitHub ──
    getGitHub: function () {
      return readJSON(K_GH, {}) || {};
    },
    setGitHub: function (obj) {
      return writeJSON(K_GH, obj || {});
    },

    /**
     * getContent() — Devuelve el contenido final fusionando las 3 capas.
     * defaults (FF_CONFIG) → published (content.json) → overrides (local).
     */
    getContent: function () {
      var defaults = window.FF_CONFIG || {};
      var merged = deepMerge(defaults, published || {});
      merged = deepMerge(merged, this.getOverrides() || {});
      return merged;
    },

    /** Fija la capa publicada como nuevo "publicado" (tras publicar en GitHub). */
    setPublishedFromOverrides: function () {
      var content = this.getContent();
      this.setPublished(content);
      return content;
    },

    /** Uso aproximado de localStorage en KB (todo el namespace ff:). */
    usageKB: function () {
      var total = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(NS) === 0) {
            var v = localStorage.getItem(k) || '';
            total += (k.length + v.length) * 2; // ~2 bytes/char (UTF-16)
          }
        }
      } catch (e) {}
      return Math.round((total / 1024) * 10) / 10;
    },

    // Exponemos utilidades por si admin.js las necesita.
    _deepMerge: deepMerge,
    _clone: clone,
  };

  window.FFStore = FFStore;
})();
