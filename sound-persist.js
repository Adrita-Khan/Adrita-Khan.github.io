/* sound-persist.js — persist audio-button state across page loads via localStorage */
(function () {
  var KEY = 'ak_sound_state';

  function save(id, playing) {
    try {
      var state = JSON.parse(localStorage.getItem(KEY) || '{}');
      state[id] = playing;
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable */ }
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) { return {}; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var state = load();
    var btns = ['hz528-btn', 'bell-btn', 'chime-btn'];

    btns.forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;

      /* Restore playing class if it was active on last visit */
      if (state[id]) btn.classList.add('hz-playing');

      /* Observe class mutations to persist state changes made by the page's own audio JS */
      if (typeof MutationObserver !== 'undefined') {
        var mo = new MutationObserver(function () {
          save(id, btn.classList.contains('hz-playing'));
        });
        mo.observe(btn, { attributes: true, attributeFilter: ['class'] });
      }
    });
  });
})();
