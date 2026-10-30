/* math.js — renders LaTeX written as \( ... \) (inline) or \[ ... \] (display)
   with KaTeX. KaTeX is only downloaded on pages that actually contain math,
   and math is re-rendered after every SPA page swap (spa-router.js). */
(function () {
  if (window.__mathLoader) return;
  window.__mathLoader = true;

  /* KaTeX is bundled in vendor/katex/ (no CDN needed); resolve it next to this file. */
  var me = document.currentScript;
  var BASE = (me && me.src ? me.src.replace(/[^\/]*$/, '') : '') + 'vendor/katex/';
  var loading = null;

  function add(tag, attrs) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement(tag);
      for (var k in attrs) el.setAttribute(k, attrs[k]);
      el.onload = resolve; el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  function load() {
    if (loading) return loading;
    var css = add('link', { rel: 'stylesheet', href: BASE + 'katex.min.css' });
    var js = add('script', { src: BASE + 'katex.min.js' })
      .then(function () { return add('script', { src: BASE + 'auto-render.min.js' }); });
    var st = document.createElement('style');
    st.textContent = '.katex{font-size:1.06em}.katex-display{overflow-x:auto;overflow-y:hidden}';
    document.head.appendChild(st);
    loading = Promise.all([css, js]);
    return loading;
  }

  function render() {
    var root = document.getElementById('page-content') || document.body;
    if (!root || (root.textContent || '').indexOf('\\(') === -1 && (root.textContent || '').indexOf('\\[') === -1) return;
    load().then(function () {
      if (!window.renderMathInElement) return;
      window.renderMathInElement(root, {
        delimiters: [
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }).catch(function () { /* offline: the LaTeX source stays readable as plain text */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
  document.addEventListener('spa:navigate', render);
})();
