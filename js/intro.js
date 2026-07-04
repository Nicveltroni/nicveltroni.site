// ── Intro typewriter animation ──
// 3 screens: heading ("Hi! I'm NIC VELTRONI / a PRODUCT DESIGNER.") →
//            para1 (work) → para2 (focus). Triggered when scrolled into view.
(function () {
  'use strict';

  var slot = document.querySelector('.intro-slot');
  if (!slot) return;

  var TYPE_SLOW = 75;  // heading / thin "filler" text
  var TYPE_FAST = 32;  // body paragraphs
  var TYPE_INFLATE = 38; // PRODUCT DESIGNER / HUMAN EXPERIENCE morph

  var triggered = false, cooldown = false;
  var flickerTimer = null, flickerPxs = [];
  var runId = 0;

  // ── Sequence runner: chained "step(next)" calls ──
  function seq(steps) {
    var i = 0;
    (function next() { if (i < steps.length) steps[i++](next); })();
  }

  // ── Type `text` into `el` one char at a time ──
  function typeInto(el, text, speed, done) {
    var id = runId; // capture: if runId changes, this chain is orphaned → abort
    var i = 0;
    (function tick() {
      if (runId !== id) return; // ← kill orphaned chain from a previous run
      if (i < text.length) { el.textContent += text[i++]; setTimeout(tick, speed); }
      else if (done) done();
    })();
  }

  // Thin filler text helper (weight 200)
  function t(parent, text, speed, done) {
    var sp = document.createElement('span');
    sp.style.fontWeight = '200';
    sp.className = 'intro-thin';
    parent.appendChild(sp);
    typeInto(sp, text, speed, done);
  }

  // Italic helper (Helvetica via CSS class)
  function italic(parent, text, done) {
    var sp = document.createElement('span');
    sp.className = 'intro-italic';
    parent.appendChild(sp);
    typeInto(sp, text, TYPE_FAST, done);
  }

  // Bold italic uppercase — final inflated look, no animation
  function boldItalic(parent, text, done) {
    var sp = document.createElement('span');
    sp.className = 'intro-bold-italic';
    parent.appendChild(sp);
    typeInto(sp, text, TYPE_FAST, done);
  }

  // Red-highlight: type bold-italic, then sweep underline L→R
  function hl(parent, text, done) {
    var sp = document.createElement('span');
    sp.className = 'intro-highlight';
    parent.appendChild(sp);
    typeInto(sp, text, TYPE_FAST, function () {
      setTimeout(function () {
        sp.classList.add('lit');
        setTimeout(done, 480);
      }, 40);
    });
  }

  // Inflate: types thin-italic-small then morphs to bold-italic-large UPPERCASE
  function inflate(parent, text, done, opts) {
    var sp = document.createElement('span');
    sp.className = 'intro-inflate';
    if (opts && opts.nowrap) sp.style.whiteSpace = 'nowrap';
    parent.appendChild(sp);
    typeInto(sp, text, TYPE_INFLATE, function () {
      sp.classList.add('inflated');
      done && done();
    });
  }

  // ── Pixel-logo flicker (red) for the inline NIC VELTRONI in the heading ──
  function flicker() {
    if (!flickerPxs.length) return;
    var count = 3 + Math.floor(Math.random() * 5);
    var idx = [];
    while (idx.length < count && idx.length < flickerPxs.length) {
      var i = Math.floor(Math.random() * flickerPxs.length);
      if (idx.indexOf(i) === -1) idx.push(i);
    }
    idx.forEach(function (i) {
      var el = flickerPxs[i];
      el.style.fill = '#FF2200';
      el.style.filter = 'drop-shadow(0 0 1.5px #FF2200)';
    });
    setTimeout(function () {
      idx.forEach(function (i) {
        flickerPxs[i].style.fill = '';
        flickerPxs[i].style.filter = '';
      });
    }, 400 + Math.random() * 600);
    flickerTimer = setTimeout(flicker, 300 + Math.random() * 500);
  }

  // ── Fade helpers ──
  function fadeOut(done) {
    var id = runId; // capture: abort if runId changes during the fade delay
    slot.style.opacity = '0';
    setTimeout(function () {
      if (runId !== id) return; // orphaned — a new run() has already started
      slot.innerHTML = '';
      done();
    }, 500);
  }
  function fadeIn() { slot.style.opacity = '1'; }

  // ── Screen 1: heading ──
  function typeHeading(done) {
    var h = document.createElement('h1');
    h.className = 'intro-heading';
    slot.appendChild(h);

    h.style.whiteSpace = 'nowrap';

    var line1 = document.createElement('span');
    line1.style.fontWeight = '400';
    h.appendChild(line1);

    seq([
      function (n) { typeInto(line1, "Hi! I'm Nic, a ", TYPE_SLOW, n); },
      function () {
        boldItalic(h, 'Product Designer.', function () {
          var id = runId;
          setTimeout(function () { if (runId !== id) return; done(); }, 2000);
        });
      }
    ]);
  }

  // ── Screen 2: paragraph 1 ──
  function typePara1(done) {
    var p = document.createElement('p');
    p.className = 'intro-para';
    slot.appendChild(p);
    seq([
      function (n) { t(p, "I'm a ", TYPE_FAST, n); },
      function (n) { boldItalic(p, 'full stack creative', n); },
      function (n) { t(p, ', I ', TYPE_FAST, n); },
      function (n) { italic(p, 'design', n); },
      function (n) { t(p, ' from ', TYPE_FAST, n); },
      function (n) { boldItalic(p, 'the vision', n); },
      function (n) { t(p, ' to ', TYPE_FAST, n); },
      function (n) { boldItalic(p, 'the detail', n); },
      function (n) { t(p, ' of a', TYPE_FAST, n); },
      function (n) { italic(p, 'project', n); },
      function (n) { t(p, '.', TYPE_FAST, function () {
        var id = runId;
        setTimeout(function () { if (runId !== id) return; done(); }, 2200);
      }); }
    ]);
  }

  // ── Screen 3: paragraph 2 ──
  function typePara2(done) {
    var p = document.createElement('p');
    p.className = 'intro-para';
    slot.appendChild(p);

    // First line: "I'm focused on HUMAN EXPERIENCE" — forced single line, centered
    var line1 = document.createElement('span');
    line1.style.cssText = 'white-space:nowrap;display:block;text-align:center;';
    p.appendChild(line1);

    seq([
      function (n) { t(line1, "I'm ", TYPE_FAST, n); },
      function (n) { italic(line1, 'focused', n); },
      function (n) { t(line1, ' on ', TYPE_FAST, n); },
      function (n) { boldItalic(line1, 'human experience', n); },
      function (n) { t(line1, ':', TYPE_FAST, n); },
      function (n) { t(p, 'how ', TYPE_FAST, n); },
      function (n) { boldItalic(p, 'brands', n); },
      function (n) { t(p, ' and ', TYPE_FAST, n); },
      function (n) { boldItalic(p, 'products', n); },
      function (n) { t(p, " enter people's daily lives and ", TYPE_FAST, n); },
      function (n) { italic(p, 'shape ', n); },
      function (n) { boldItalic(p, 'culture, space and identity', n); },
      function (n) { t(p, '.', TYPE_FAST, n); },
      function (n) {
        var id = runId;
        if (done) setTimeout(function () { if (runId !== id) return; done(); }, 2000);
        n();
      }
    ]);
  }

  // ── Full sequence ──
  function run() {
    ++runId;
    if (flickerTimer) { clearTimeout(flickerTimer); flickerTimer = null; }
    flickerPxs = [];
    slot.innerHTML = '';
    slot.style.opacity = '1';

    // Dopo para2 aspetta 3s poi ricomincia da capo
    var onPara2Done = function () {
      var id = runId;
      setTimeout(function () {
        if (runId !== id) return; // user scrolled away during the pause
        fadeOut(function () { run(); });
      }, 3000);
    };

    typeHeading(function () {
      fadeOut(function () {
        fadeIn();
        typePara1(function () {
          fadeOut(function () { fadeIn(); typePara2(onPara2Done); });
        });
      });
    });
  }

  // ── Trigger when intro section enters viewport; reset when fully out ──
  var pageScroll = document.getElementById('page-scroll');
  var section = document.getElementById('intro-section');
  if (!pageScroll || !section) return;

  pageScroll.addEventListener('scroll', function () {
    var rect = section.getBoundingClientRect();
    var out  = rect.bottom <= 0 || rect.top >= window.innerHeight;
    var inView = rect.top < window.innerHeight * 0.5 && rect.bottom > 0;

    if (out && triggered) {
      triggered = false; cooldown = true;
      ++runId;
      if (flickerTimer) { clearTimeout(flickerTimer); flickerTimer = null; flickerPxs = []; }
      slot.style.opacity = '1'; slot.innerHTML = '';
      setTimeout(function () {
        cooldown = false;
        // Free scroll: user may have settled into intro during the cooldown
        // with no further scroll event to retrigger — check now
        var r = section.getBoundingClientRect();
        if (!triggered && r.top < window.innerHeight * 0.5 && r.bottom > 0) {
          triggered = true; run();
        }
      }, 600);
    }
    if (inView && !triggered && !cooldown) {
      triggered = true; run();
    }
  }, { passive: true });

  // Mobile: la pagina ora scorre normalmente, quindi il trigger
  // via scroll qui sopra copre anche i viewport ≤768px.
})();
