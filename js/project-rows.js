// ── Home project rows: the white text half opens the project too ──
// Forwards a click on the title/description half to the row's card, so the
// global js-open-* handler (hero-panel.js) opens the panel from the card.
(function () {
  'use strict';

  document.querySelectorAll('.proj-row-text').forEach(function (text) {
    var card = text.parentNode.querySelector('.proj-card');
    if (!card) return;
    text.addEventListener('click', function () { card.click(); });
  });
})();
