/* nav-prefetch.js — prefetch nav pages on link hover for faster navigation */
(function () {
  if (!('IntersectionObserver' in window) && !('fetch' in window)) return;

  var prefetched = new Set();

  function prefetch(href) {
    if (prefetched.has(href)) return;
    prefetched.add(href);
    try {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'document';
      document.head.appendChild(link);
    } catch (e) { /* silent */ }
  }

  function attachHover(el) {
    el.addEventListener('mouseenter', function () {
      var href = el.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto')) {
        prefetch(href);
      }
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* Prefetch all nav links and mobile nav links */
    var selectors = '#quick-links .nav-list a, .mobile-nav-list a';
    document.querySelectorAll(selectors).forEach(attachHover);
  });
})();
