/* spa-router.js — SPA navigation: no-flicker, continuous audio, consistent nav
   Intercepts internal .html link clicks, swaps #page-content only,
   preserving <header> (nav + sound buttons) and all <script> engines.
   ======================================================================= */
(function () {
  'use strict';

  /* ── helpers ── */
  function getFile(url) {
    try {
      var p = new URL(url, location.href).pathname.split('/').pop();
      return p || 'index.html';
    } catch (e) {
      return (url.split('/').pop() || 'index.html');
    }
  }

  var currentFile = getFile(location.href);
  var pageCache   = {};   // file → parsed Document

  /* hrefs of <link rel="stylesheet"> that are shared across all pages (never removed) */
  var sharedLinkHrefs = {};

  /* ── Seed shared link hrefs from the initial page load ── */
  function seedStyleCache() {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var j = 0; j < links.length; j++) {
      sharedLinkHrefs[links[j].href] = true;
    }
  }

  /* ── Swap page-specific styles: remove old injected ones, inject new ones ── */
  function injectStyles(doc) {
    /* remove previously injected page-specific style tags */
    var old = document.querySelectorAll('style[data-spa]');
    for (var k = 0; k < old.length; k++) old[k].parentNode.removeChild(old[k]);

    /* inject all <style> blocks from the new page */
    var styles = doc.querySelectorAll('style');
    for (var i = 0; i < styles.length; i++) {
      var el = document.createElement('style');
      el.setAttribute('data-spa', '1');
      el.textContent = styles[i].textContent || '';
      document.head.appendChild(el);
    }

    /* inject any new external <link rel="stylesheet"> (shared ones stay) */
    var links = doc.querySelectorAll('link[rel="stylesheet"]');
    for (var j = 0; j < links.length; j++) {
      var href = links[j].href;
      if (sharedLinkHrefs[href]) continue;
      sharedLinkHrefs[href] = true;
      var lel = document.createElement('link');
      lel.rel  = 'stylesheet';
      lel.href = href;
      lel.setAttribute('data-spa', '1');
      document.head.appendChild(lel);
    }
  }

  /* ── Update active state on nav links ── */
  function setActiveNav(file) {
    var links = document.querySelectorAll('.nav-list a, .mobile-nav-list a');
    for (var i = 0; i < links.length; i++) {
      var a    = links[i];
      var href = (a.getAttribute('href') || '');
      var active = (href === file);
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else        a.removeAttribute('aria-current');
    }
  }

  /* ── Update side-nav arrow hrefs & labels from parsed doc ── */
  function updateSideNav(doc) {
    var sides = ['.side-nav-left', '.side-nav-right'];
    for (var i = 0; i < sides.length; i++) {
      var newEl = doc.querySelector(sides[i]);
      var curEl = document.querySelector(sides[i]);

      if (newEl && curEl) {
        /* update existing arrow in place */
        curEl.setAttribute('href',       newEl.getAttribute('href')       || '');
        curEl.setAttribute('title',      newEl.getAttribute('title')      || '');
        curEl.setAttribute('aria-label', newEl.getAttribute('aria-label') || '');
        var curLbl = curEl.querySelector('.side-nav-label');
        var newLbl = newEl.querySelector('.side-nav-label');
        if (curLbl && newLbl) curLbl.textContent = newLbl.textContent;
      } else if (newEl && !curEl) {
        /* new page has this arrow but DOM doesn't — insert it */
        document.body.appendChild(newEl.cloneNode(true));
      } else if (!newEl && curEl) {
        /* new page has no arrow — remove it from DOM */
        curEl.parentNode.removeChild(curEl);
      }
    }
  }

  /* ── Scroll-to-top reinit ── */
  var _scrollHandler = null;
  function reinitScrollTop() {
    var btn = document.getElementById('scrollToTop');
    if (!btn) return;
    btn.classList.remove('visible');
    if (_scrollHandler) window.removeEventListener('scroll', _scrollHandler);
    _scrollHandler = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      btn.classList.toggle('visible', y > 300);
    };
    window.addEventListener('scroll', _scrollHandler, { passive: true });
    btn.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  }

  /* ── Reading progress bar reinit ── */
  var _progressHandler = null;
  function reinitProgress() {
    var bar = document.getElementById('reading-progress');
    if (!bar) return;
    if (_progressHandler) window.removeEventListener('scroll', _progressHandler);
    _progressHandler = function () {
      var s = window.pageYOffset || document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (h > 0 ? Math.min(s / h * 100, 100) : 0) + '%';
    };
    window.addEventListener('scroll', _progressHandler, { passive: true });
    _progressHandler();
  }

  /* ── Swap #page-content ── */
  function swapContent(doc, file) {
    var newMain = doc.getElementById('page-content');
    var curMain = document.getElementById('page-content');

    if (!newMain || !curMain) {
      /* fallback: hard navigate if wrapper missing */
      location.href = file;
      return;
    }

    injectStyles(doc);

    /* quick cross-fade */
    curMain.style.transition = 'opacity 0.13s ease';
    curMain.style.opacity    = '0';

    setTimeout(function () {
      curMain.innerHTML  = newMain.innerHTML;
      document.title     = doc.title || document.title;

      setActiveNav(file);
      updateSideNav(doc);

      window.scrollTo(0, 0);

      /* restore opacity */
      curMain.style.opacity = '1';

      reinitScrollTop();
      reinitProgress();

      /* Reconnect sound-bridge: after innerHTML swap, nav-sound buttons
         are still in the header (never swapped), and #sound-panel is also
         outside #page-content so it persists — nothing to rewire. */

      /* fire a lightweight custom event so page-specific code can hook in */
      try {
        document.dispatchEvent(new CustomEvent('spa:navigate', { detail: { file: file } }));
      } catch (e) {}

    }, 130);
  }

  /* ── Fetch + navigate ── */
  function navigate(href, push) {
    var file = getFile(href);
    if (file === currentFile) return;   /* already here */

    if (push) history.pushState({ file: file }, '', href);
    currentFile = file;

    if (pageCache[file]) {
      swapContent(pageCache[file], file);
      return;
    }

    fetch(href, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc    = parser.parseFromString(html, 'text/html');
        pageCache[file] = doc;
        swapContent(doc, file);
      })
      .catch(function () {
        /* network error or page not found → hard navigate */
        location.href = href;
      });
  }

  /* ── Intercept link clicks ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    /* only handle same-origin .html links */
    if (a.target === '_blank')           return;
    if (!href.endsWith('.html'))         return;
    if (href.indexOf('//') !== -1)       return;   /* absolute URL */
    if (href.startsWith('mailto:'))      return;
    e.preventDefault();
    navigate(href, true);
  }, true /* capture so we beat any other click handler */);

  /* ── Back / forward ── */
  window.addEventListener('popstate', function () {
    var file = getFile(location.href);
    /* reset so navigate() won't short-circuit on same-file check */
    currentFile = '__popstate__';
    navigate(location.href, false);
    currentFile = file;
  });

  /* ── Prefetch on hover (keeps fast-nav feeling) ── */
  function prefetch(href) {
    var file = getFile(href);
    if (pageCache[file]) return;
    fetch(href, { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        pageCache[file] = doc;
      })
      .catch(function () {});
  }

  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.endsWith('.html') && href.indexOf('//') === -1) prefetch(href);
  }, { passive: true });

  /* ── Bootstrap ── */
  history.replaceState({ file: currentFile }, '', location.href);

  document.addEventListener('DOMContentLoaded', function () {
    seedStyleCache();
    /* cache the initial page's parsed doc for back-nav */
    try {
      var parser = new DOMParser();
      pageCache[currentFile] = parser.parseFromString(document.documentElement.outerHTML, 'text/html');
    } catch (e) {}
    reinitScrollTop();
    reinitProgress();
    setActiveNav(currentFile);
  });

})();
