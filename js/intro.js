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

  // ── Mobile: lock slot height to the tallest of the 3 screens so the
  //    typewriter never reflows the layout below it. Must mirror the final
  //    text of typeHeading/typePara1/typePara2 below. ──
  var mobileMQ = window.matchMedia('(max-width: 768px)');
  var SCREEN_MARKUP = [
    '<h1 class="intro-heading"><span class="intro-thin">Hi I\'m Nic, a </span><span class="intro-bold-italic">Product Designer.</span></h1>',
    '<p class="intro-para"><span class="intro-thin">I\'m an aspiring </span><span class="intro-bold-italic">full-stack creative and builder</span><span class="intro-thin"> who </span><span class="intro-italic">loves</span><span class="intro-thin"> making </span><span class="intro-bold-italic">products of my own</span><span class="intro-thin">.</span></p>',
    '<p class="intro-para"><span class="intro-thin">I\'m particularly </span><span class="intro-italic">interested</span><span class="intro-thin"> in how </span><span class="intro-bold-italic">brands</span><span class="intro-thin"> and </span><span class="intro-bold-italic">products</span><span class="intro-thin"> enter people\'s daily lives and </span><span class="intro-italic">shape </span><span class="intro-bold-italic">culture, space and identity</span><span class="intro-thin">.</span></p>'
  ];
  function lockSlotHeight() {
    if (!mobileMQ.matches) { slot.style.minHeight = ''; return; }
    var prevHTML = slot.innerHTML;
    var prevVisibility = slot.style.visibility;
    slot.style.minHeight = '';
    slot.style.visibility = 'hidden';
    var max = 0;
    SCREEN_MARKUP.forEach(function (html) {
      slot.innerHTML = html;
      if (slot.scrollHeight > max) max = slot.scrollHeight;
    });
    slot.innerHTML = prevHTML;
    slot.style.minHeight = max + 'px';
    slot.style.visibility = prevVisibility;
  }
  lockSlotHeight();
  window.addEventListener('resize', lockSlotHeight, { passive: true });

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

  // Filler text helper — weight/color come from .intro-thin in style.css
  function t(parent, text, speed, done) {
    var sp = document.createElement('span');
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
    line1.className = 'intro-thin';
    h.appendChild(line1);

    seq([
      function (n) { typeInto(line1, "Hi I'm Nic, a ", TYPE_SLOW, n); },
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
      function (n) { t(p, "I'm an aspiring ", TYPE_FAST, n); },
      function (n) { boldItalic(p, 'full-stack creative and builder', n); },
      function (n) { t(p, ' who ', TYPE_FAST, n); },
      function (n) { italic(p, 'loves', n); },
      function (n) { t(p, ' making ', TYPE_FAST, n); },
      function (n) { boldItalic(p, 'products of my own', n); },
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

    seq([
      function (n) { t(p, "I'm particularly ", TYPE_FAST, n); },
      function (n) { italic(p, 'interested', n); },
      function (n) { t(p, ' in how ', TYPE_FAST, n); },
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

  function checkTrigger() {
    var rect = section.getBoundingClientRect();
    var out  = rect.bottom <= 0 || rect.top >= window.innerHeight;
    // Fire as soon as the section starts entering from the bottom (top within
    // the lower 90% of the viewport) so the text is already animating by the
    // time the section is centered.
    var inView = rect.top < window.innerHeight * 0.9 && rect.bottom > 0;

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
        if (!triggered && r.top < window.innerHeight * 0.9 && r.bottom > 0) {
          triggered = true; run();
        }
      }, 600);
    }
    if (inView && !triggered && !cooldown) {
      triggered = true; run();
    }
  }

  pageScroll.addEventListener('scroll', checkTrigger, { passive: true });
  window.addEventListener('resize', checkTrigger, { passive: true });
  // Start even if the section is already in view on load (e.g. the browser
  // restored the scroll position on reload). The scroll listener alone would
  // never fire in that case, leaving the text blank.
  checkTrigger();

  // Mobile: la pagina ora scorre normalmente, quindi il trigger
  // via scroll qui sopra copre anche i viewport ≤768px.
})();
