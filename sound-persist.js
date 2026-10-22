/* sound-persist.js — keep the ambient sound going across full page loads.

   In-site navigation (spa-router.js) never interrupts the audio. A full page load
   does (the AudioContext is destroyed), so we remember which sound was playing for
   the rest of this visit (sessionStorage, same as the theme) and restart it on the
   visitor's first click or key press. Browsers refuse to start audio before such a
   gesture, so the buttons are never drawn as "playing" while nothing is audible. */
(function () {
  var KEY = 'ak_sound_state';
  var IDS = ['hz528-btn', 'bell-btn', 'chime-btn'];

  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function save(id, playing) {
    try {
      var state = load();
      state[id] = playing;
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* an older version kept this flag in localStorage forever; drop it */
    try { localStorage.removeItem(KEY); } catch (e) {}

    var saved = load();
    var resumeId = null;

    IDS.forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;

      /* Persist state changes made by the page's own audio engine */
      if (typeof MutationObserver !== 'undefined') {
        var mo = new MutationObserver(function () {
          save(id, btn.classList.contains('hz-playing'));
        });
        mo.observe(btn, { attributes: true, attributeFilter: ['class'] });
      }

      if (saved[id] && !resumeId) resumeId = id;
    });

    if (!resumeId) return;

    /* Restart the remembered sound on the first real gesture — unless that gesture
       is the visitor choosing a sound themselves. */
    function onGesture(e) {
      if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Escape')) return;
      document.removeEventListener('click', onGesture, true);
      document.removeEventListener('keydown', onGesture, true);

      var t = e.target;
      var onSoundBtn = t && t.closest && t.closest('.nav-sound-btn, #sound-panel');
      var btn = document.getElementById(resumeId);
      if (onSoundBtn || !btn || btn.classList.contains('hz-playing')) {
        if (onSoundBtn) save(resumeId, false);
        return;
      }
      btn.click();
    }
    document.addEventListener('click', onGesture, true);
    document.addEventListener('keydown', onGesture, true);
  });
})();
