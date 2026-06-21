/**
 * sound-persist.js
 * SPA-style navigation that keeps the three ambient sounds (528 Hz, Carillon,
 * Wind Chime) playing uninterrupted across page transitions.
 *
 * Strategy
 * ─────────
 * All three sounds run in Web Audio API closures whose state is referenced by
 * window._hz528Stop / _bellStop / _chimeStop (etc.). Those globals live on
 * window, which is only destroyed by a true page reload.  If we intercept
 * internal nav clicks, fetch the target page, and swap the <body> content
 * (preserving #sound-panel in place), window is never reloaded → audio never
 * stops.
 *
 * Works together with nav-prefetch.js: fetched pages arrive from the browser's
 * prefetch cache in < 10 ms, so the swap feels instant.
 */
(function () {
    'use strict';

    var PAGES = [
        'index.html', 'education.html', 'publications.html',
        'research.html', 'academic_experience.html',
        'achievements.html', 'notes.html', 'contact.html'
    ];

    /* Substrings that identify the three sound-panel IIFEs.
       Scripts containing any of these are skipped on SPA navigation so the
       existing Audio contexts / closures keep running. */
    var SOUND_MARKERS = ['_hz528Stop', '_bellStop', '_chimeStop'];

    var busy = false;

    /* ── helpers ─────────────────────────────────────────────────────────── */

    function isInternal(href) {
        if (!href) return false;
        if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) return false;
        var page = href.split('/').pop().split('?')[0].split('#')[0];
        return PAGES.indexOf(page) !== -1;
    }

    function isSoundScript(text) {
        return SOUND_MARKERS.some(function (m) { return text.indexOf(m) !== -1; });
    }

    function updateActiveNav(url) {
        var page = url.split('/').pop().split('?')[0] || 'index.html';
        document.querySelectorAll('.nav-list a').forEach(function (a) {
            var h = (a.getAttribute('href') || '').split('/').pop().split('?')[0];
            var active = (h === page) || (!h && page === 'index.html');
            a.classList.toggle('active', active);
            if (active) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
    }

    /* ── core navigation ─────────────────────────────────────────────────── */

    function navigate(url) {
        if (busy) return;
        busy = true;

        /* Nodes we must keep alive across the swap */
        var soundPanel    = document.getElementById('sound-panel');
        var searchOverlay = document.getElementById('search-overlay');

        fetch(url, { credentials: 'same-origin' })
            .then(function (r) { return r.text(); })
            .then(function (html) {

                var parser = new DOMParser();
                var newDoc = parser.parseFromString(html, 'text/html');

                /* 1 ── Title ─────────────────────────────────────────────── */
                document.title = newDoc.title;

                /* 2 ── Styles ────────────────────────────────────────────── */
                /* Collect CSS from both <head> and <body> of the new page,
                   inject as a single replaceable block. */
                var old = document.getElementById('__spa-styles');
                if (old) old.remove();
                var css = '';
                newDoc.querySelectorAll('head style, body style').forEach(
                    function (s) { css += s.textContent; }
                );
                if (css) {
                    var styleEl = document.createElement('style');
                    styleEl.id = '__spa-styles';
                    styleEl.textContent = css;
                    document.head.appendChild(styleEl);
                }

                /* 3 ── Extract scripts before cloning (prevents inert dupes) */
                var scripts = [];
                newDoc.body.querySelectorAll('script').forEach(function (s) {
                    scripts.push({
                        src:  s.getAttribute('src'),
                        text: s.textContent
                    });
                    s.parentNode.removeChild(s);
                });

                /* 4 ── Build new body fragment (skip persistent nodes) ────── */
                var frag = document.createDocumentFragment();
                Array.from(newDoc.body.children).forEach(function (child) {
                    if (child.id === 'sound-panel' ||
                        child.id === 'search-overlay') return;
                    frag.appendChild(child.cloneNode(true));
                });

                /* 5 ── Swap body content ─────────────────────────────────── */
                Array.from(document.body.children).forEach(function (child) {
                    if (child === soundPanel || child === searchOverlay) return;
                    child.remove();
                });
                /* Insert new content before sound-panel so it stays at the end */
                document.body.insertBefore(frag, soundPanel || null);

                /* 6 ── URL / scroll / nav ────────────────────────────────── */
                history.pushState({ url: url }, document.title, url);
                window.scrollTo(0, 0);
                updateActiveNav(url);

                /* 7 ── Re-execute page scripts ───────────────────────────── */
                /* Temporarily redirect DOMContentLoaded registrations so scripts
                   that do document.addEventListener('DOMContentLoaded', fn)
                   fire their callback immediately (DCL already fired). */
                var origAddEvt = document.addEventListener;
                document.addEventListener = function (type, fn, opts) {
                    if (type === 'DOMContentLoaded') {
                        try { fn(new Event('DOMContentLoaded')); } catch (e) {}
                    } else {
                        origAddEvt.call(document, type, fn, opts);
                    }
                };

                scripts.forEach(function (s) {
                    /* Keep sound closures running — never re-execute them */
                    if (isSoundScript(s.text)) return;
                    /* Skip external scripts (nav-prefetch, sound-persist,
                       search-data — all already loaded) */
                    if (s.src) return;
                    var ns = document.createElement('script');
                    ns.textContent = s.text;
                    document.body.appendChild(ns);
                    ns.remove(); /* executed synchronously; clean up the node */
                });

                document.addEventListener = origAddEvt;

                busy = false;
            })
            .catch(function () {
                /* On any error fall back to a normal navigation */
                busy = false;
                window.location.href = url;
            });
    }

    /* ── event wiring ────────────────────────────────────────────────────── */

    /* Intercept internal link clicks (capture phase so we beat other handlers) */
    document.addEventListener('click', function (e) {
        /* Honour modifier keys so "open in new tab" still works */
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!isInternal(href)) return;
        e.preventDefault();
        navigate(href);
    }, true);

    /* Browser back / forward */
    window.addEventListener('popstate', function (e) {
        navigate(e.state && e.state.url ? e.state.url : location.href);
    });

    /* Seed initial history entry so the back button can return to page 1 */
    history.replaceState({ url: location.href }, document.title, location.href);

})();
