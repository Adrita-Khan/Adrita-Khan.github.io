/**
 * nav-prefetch.js
 * Prefetches all portfolio pages in the background so navigation feels instant.
 * Uses requestIdleCallback to avoid competing with page rendering,
 * and upgrades to an immediate prefetch on nav-link hover.
 */
(function () {
    'use strict';

    var PAGES = [
        'index.html',
        'education.html',
        'publications.html',
        'research.html',
        'academic_experience.html',
        'achievements.html',
        'notes.html',
        'contact.html'
    ];

    // Derive the current page filename from the URL
    var current = location.pathname.split('/').pop() || 'index.html';

    var done = {};

    function hint(href, rel) {
        if (done[href]) return;
        done[href] = true;
        var link = document.createElement('link');
        link.rel  = rel || 'prefetch';
        link.href = href;
        link.as   = 'document';
        document.head.appendChild(link);
    }

    // Prefetch every page (except the current one) during idle time
    function prefetchAll() {
        PAGES.forEach(function (page) {
            if (page !== current) hint(page, 'prefetch');
        });
    }

    if (window.requestIdleCallback) {
        requestIdleCallback(prefetchAll, { timeout: 3000 });
    } else {
        setTimeout(prefetchAll, 1500);
    }

    // On any nav-link hover, immediately prefetch that page
    // so clicking feels instantaneous even if idle hasn't fired yet
    document.addEventListener('mouseover', function (e) {
        var a = e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        // Skip external links, anchors, mailto, tel
        if (!href || /^(https?:|mailto:|tel:|#|javascript:)/.test(href)) return;
        hint(href, 'prefetch');
    }, { passive: true });

    // Mobile: prefetch on touchstart (fires before tap completes)
    document.addEventListener('touchstart', function (e) {
        var a = e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href || /^(https?:|mailto:|tel:|#|javascript:)/.test(href)) return;
        hint(href, 'prefetch');
    }, { passive: true });
})();
