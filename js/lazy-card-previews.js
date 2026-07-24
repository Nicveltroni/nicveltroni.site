// ── Lazy-load the Flea/Vilya card preview iframes ──
// These embed a full three.js scene (Flea) and a canvas halftone animation
// (Vilya) with their own JS/asset payloads. Loaded eagerly they used to fire
// on the very first paint of the homepage, well before the projects grid was
// ever scrolled into view, competing for bandwidth with everything else on
// the page. Load each iframe's real src only once its card is about to enter
// the viewport.
(function () {
  'use strict';

  var frames = Array.prototype.slice.call(document.querySelectorAll('.vilya-card-preview[data-src]'));
  if (!frames.length) return;

  if (!('IntersectionObserver' in window)) {
    frames.forEach(function (f) { f.src = f.getAttribute('data-src'); });
    return;
  }

  var io = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var f = entry.target;
      if (!f.getAttribute('src')) f.src = f.getAttribute('data-src');
      obs.unobserve(f);
    });
  }, { rootMargin: '400px' });

  frames.forEach(function (f) { io.observe(f); });
})();
