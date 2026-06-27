/* spa-router.js — SPA navigation: smooth transitions, continuous audio, consistent nav
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
  var stylesSeen  = {};   // fingerprint → true
  var navigating  = false;

  /* ── Inject View Transition keyframes once ── */
  function ensureVTStyles() {
    if (document.getElementById('__spa-vt-styles')) return;
    var s = document.createElement('style');
    s.id = '__spa-vt-styles';
    s.textContent =
      '::view-transition-old(page-content){animation:110ms cubic-bezier(.4,0,.2,1) both __vt-out}' +
      '::view-transition-new(page-content){animation:140ms cubic-bezier(.4,0,.2,1) both __vt-in}' +
      '@keyframes __vt-out{to{opacity:0;transform:translateY(-7px)}}' +
      '@keyframes __vt-in{from{opacity:0;transform:translateY(7px)}}';
    document.head.appendChild(s);
  }

  /* ── Seed style cache with already-present styles ── */
  function seedStyleCache() {
    var all = document.querySelectorAll('style');
    for (var i = 0; i < all.length; i++) {
      var txt = all[i].textContent || '';
      stylesSeen[txt.length + '|' + txt.slice(0, 120)] = true;
    }
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var j = 0; j < links.length; j++) {
      stylesSeen['link|' + links[j].href] = true;
    }
  }

  /* ── Inject <style> and <link rel="stylesheet"> from a parsed page ── */
  function injectStyles(doc) {
    var styles = doc.querySelectorAll('style');
    for (var i = 0; i < styles.length; i++) {
      var txt = styles[i].textContent || '';
      var key = txt.length + '|' + txt.slice(0, 120);
      if (stylesSeen[key]) continue;
      stylesSeen[key] = true;
      var el = document.createElement('style');
      el.setAttribute('data-spa', '1');
      el.textContent = txt;
      document.head.appendChild(el);
    }
    var links = doc.querySelectorAll('link[rel="stylesheet"]');
    for (var j = 0; j < links.length; j++) {
      var href = links[j].href;
      var lkey = 'link|' + href;
      if (stylesSeen[lkey]) continue;
      stylesSeen[lkey] = true;
      var lel = document.createElement('link');
      lel.rel  = 'stylesheet';
      lel.href = href;
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
      if (!newEl || !curEl) continue;
      curEl.setAttribute('href',       newEl.getAttribute('href')       || '');
      curEl.setAttribute('title',      newEl.getAttribute('title')      || '');
      curEl.setAttribute('aria-label', newEl.getAttribute('aria-label') || '');
      var curLbl = curEl.querySelector('.side-nav-label');
      var newLbl = newEl.querySelector('.side-nav-label');
      if (curLbl && newLbl) curLbl.textContent = newLbl.textContent;
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

  /* ── Core content swap ── */
  function doSwap(doc, file) {
    var newMain = doc.getElementById('page-content');
    var curMain = document.getElementById('page-content');
    if (!newMain || !curMain) { location.href = file; return; }
    injectStyles(doc);
    curMain.innerHTML  = newMain.innerHTML;
    document.title     = doc.title || document.title;
    setActiveNav(file);
    updateSideNav(doc);
    window.scrollTo(0, 0);
    reinitScrollTop();
    reinitProgress();
    try { document.dispatchEvent(new CustomEvent('spa:navigate', { detail: { file: file } })); } catch (e) {}
  }

  /* ── Animated swap — View Transitions where available, crossfade fallback ── */
  function swapContent(doc, file) {
    var curMain = document.getElementById('page-content');
    if (!curMain) { doSwap(doc, file); navigating = false; return; }

    if (document.startViewTransition) {
      /* ── Path A: View Transitions API (Chrome 111+, Safari 18+, Edge 111+)
            Zero extra latency — browser captures old state synchronously,
            runs the swap, then animates old→new in parallel.           ── */
      ensureVTStyles();
      curMain.style.viewTransitionName = 'page-content';

      var transition = document.startViewTransition(function () {
        doSwap(doc, file);
      });

      transition.finished
        .then(function () {
          var el = document.getElementById('page-content');
          if (el) el.style.viewTransitionName = '';
        })
        .catch(function () {})
        .finally(function () { navigating = false; });

    } else {
      /* ── Path B: CSS crossfade fallback
            Fade out the old content (100ms), swap instantly, fade new in.
            The fade-out started before fetch (see navigate()), so by the
            time we arrive here content is already partially faded.     ── */
      curMain.style.transition = 'opacity 0.09s ease';
      curMain.style.opacity    = '0';

      setTimeout(function () {
        doSwap(doc, file);
        /* two rAFs guarantee the browser has committed the new DOM before
           we start fading in — avoids a flash of the old content        */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            curMain.style.transition = 'opacity 0.13s ease';
            curMain.style.opacity    = '1';
            setTimeout(function () { navigating = false; }, 140);
          });
        });
      }, 95);
    }
  }

  /* ── Fetch + navigate ── */
  function navigate(href, push) {
    var file = getFile(href);
    if (file === currentFile || navigating) return;
    navigating = true;

    if (push) history.pushState({ file: file }, '', href);
    currentFile = file;

    /* ── Cached: swap immediately (VT handles animation; no delay) ── */
    if (pageCache[file]) {
      swapContent(pageCache[file], file);
      return;
    }

    /* ── Not cached: start a subtle fade-out NOW so the user gets
          instant visual feedback while the fetch is in flight.
          swapContent() will complete the animation on arrival.   ── */
    if (!document.startViewTransition) {
      var curMain = document.getElementById('page-content');
      if (curMain) {
        curMain.style.transition = 'opacity 0.1s ease';
        curMain.style.opacity    = '0.35';
      }
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
        navigating = false;
        location.href = href;
      });
  }

  /* ── Intercept link clicks ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (a.target === '_blank')           return;
    if (!href.endsWith('.html'))         return;
    if (href.indexOf('//') !== -1)       return;
    if (href.startsWith('mailto:'))      return;
    e.preventDefault();
    navigate(href, true);
  }, true);

  /* ── Back / forward ── */
  window.addEventListener('popstate', function () {
    var file = getFile(location.href);
    currentFile = '__popstate__';
    navigate(location.href, false);
    currentFile = file;
  });

  /* ── Hover prefetch (keeps fast-nav feeling; fills cache before click) ── */
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
    try {
      var parser = new DOMParser();
      pageCache[currentFile] = parser.parseFromString(document.documentElement.outerHTML, 'text/html');
    } catch (e) {}
    reinitScrollTop();
    reinitProgress();
    setActiveNav(currentFile);
  });

})();
