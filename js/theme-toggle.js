/**
 * theme-toggle.js
 * ---------------
 * Drop-in theme switcher used across every page on the site.
 *
 * Markup contract:
 *   - One `<button id="theme-toggle">` exists in the document.
 *   - Inside it: `<svg id="theme-icon-moon">` and `<svg id="theme-icon-sun">`.
 *   - The root `<html>` carries `data-theme="dark|light"`.
 *
 * Persistence: the chosen theme is stored under `ak-theme` in sessionStorage
 * so it survives soft navigations within a tab but resets between sessions.
 *
 * The current pages each inline a copy of this logic; this file is the
 * canonical source. To migrate a page, replace its inline IIFE with:
 *   <script src="js/theme-toggle.js" defer></script>
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ak-theme';
  var STORAGE_SET = 'ak-theme-set';

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
      try {
        sessionStorage.setItem(STORAGE_KEY, theme);
        sessionStorage.setItem(STORAGE_SET, '1');
      } catch (_) { /* private mode — ignore */ }
    }
    var moon = document.getElementById('theme-icon-moon');
    var sun  = document.getElementById('theme-icon-sun');
    if (moon && sun) {
      moon.style.display = theme === 'dark'  ? 'block' : 'none';
      sun.style.display  = theme === 'light' ? 'block' : 'none';
    }
  }

  function preferredTheme() {
    try {
      if (sessionStorage.getItem(STORAGE_SET)) {
        return sessionStorage.getItem(STORAGE_KEY) || 'dark';
      }
    } catch (_) { /* ignore */ }
    return 'dark';
  }

  function init() {
    var current = document.documentElement.getAttribute('data-theme') || preferredTheme();
    applyTheme(current, false);

    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var now = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(now === 'dark' ? 'light' : 'dark', true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
