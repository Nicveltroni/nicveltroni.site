/* ════════════════════════════════════════════════════════════════
   TEARDOWN ENGINE — NV-2026 / REV.04
   Vanilla JS. No dependencies. Everything degrades gracefully.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── tiny mechanical click via WebAudio (no asset needed) ── */
  var audioCtx = null;
  function clack(freq, gain) {
    if (reduceMotion) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq || 180, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.04);
      g.gain.setValueAtTime(gain || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + 0.07);
    } catch (e) { /* audio unavailable: fine */ }
  }
  function haptic(ms) { if (navigator.vibrate && !reduceMotion) navigator.vibrate(ms); }

  /* ════════ 1 · SEALED UNIT — scroll opens the housing ════════ */
  var unit = $('#unit');
  var unitSticky = $('#unit-sticky');
  var latched = false;

  function heroTick() {
    if (!unit || !unitSticky || document.body.classList.contains('manual') || reduceMotion) return;
    var rect = unit.getBoundingClientRect();
    var travel = unit.offsetHeight - window.innerHeight;
    var p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 1;
    unitSticky.style.setProperty('--p', p.toFixed(4));
    if (p > 0.12 && !latched) { latched = true; clack(220, 0.07); haptic(8); }
    if (p < 0.04) latched = false;
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(heroTick); }, { passive: true });
  heroTick();

  /* ════════ 2 · SEAL STATE — broken seals are remembered ════════ */
  function sealKey(k) { return 'td-opened-' + k; }
  function markOpened(key) {
    try { localStorage.setItem(sealKey(key), '1'); } catch (e) {}
    var comp = $('.comp[data-key="' + key + '"]');
    if (comp) comp.classList.add('is-opened');
    var mm = $('#minimap .mm-part[data-open="' + key + '"]');
    if (mm) mm.classList.add('mm-done');
  }
  $$('.comp[data-key]').forEach(function (comp) {
    try {
      if (localStorage.getItem(sealKey(comp.dataset.key))) {
        comp.classList.add('is-opened');
        var mm = $('#minimap .mm-part[data-open="' + comp.dataset.key + '"]');
        if (mm) mm.classList.add('mm-done');
      }
    } catch (e) {}
  });

  /* ════════ 3 · LAZY MEDIA inside bays ════════ */
  var lazyObs = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (en.isIntersecting) {
        if (v.dataset.src && !v.src) v.src = v.dataset.src;
        if (v.tagName === 'VIDEO') { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      } else if (v.tagName === 'VIDEO' && !v.paused) {
        v.pause();
      }
    });
  }, { rootMargin: '200px' }) : null;

  function armLazy(scope) {
    $$('video[data-src]', scope).forEach(function (v) {
      if (lazyObs) lazyObs.observe(v);
      else if (!v.src) { v.src = v.dataset.src; v.play().catch(function () {}); }
    });
  }

  /* the Pro Nap app video restarts at 15s, like the original site */
  var appVideo = $('#pnr-app-video');
  if (appVideo) appVideo.addEventListener('timeupdate', function () {
    if (appVideo.currentTime >= 15) { appVideo.currentTime = 0; appVideo.play().catch(function () {}); }
  });

  /* ════════ 4 · EXTRACTION — open / close bays ════════ */
  var openBay = null;
  var lastTrigger = null;

  function extractGhost(fromEl, done) {
    if (reduceMotion || !fromEl) { done(); return; }
    var img = $('.comp-frame img', fromEl);
    if (!img) { done(); return; }
    var r = img.getBoundingClientRect();
    var ghost = document.createElement('div');
    ghost.style.cssText =
      'position:fixed;z-index:790;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;' +
      'background:url("' + img.currentSrc.replace(/"/g, '%22') + '") center/cover;border:1px solid #2e2e36;' +
      'transition:all .5s cubic-bezier(.2,.9,.3,1);will-change:transform,left,top,width,height;';
    document.body.appendChild(ghost);
    /* unseat: lift + tilt, then fill the viewport */
    requestAnimationFrame(function () {
      ghost.style.transform = 'translateY(-10px) rotate(-1.2deg)';
      setTimeout(function () {
        ghost.style.left = '0px'; ghost.style.top = '0px';
        ghost.style.width = '100vw'; ghost.style.height = '100vh';
        ghost.style.transform = 'none'; ghost.style.opacity = '0.25';
      }, 160);
      setTimeout(function () { ghost.remove(); done(); }, 620);
    });
  }

  function open(key, triggerEl) {
    var bay = $('#bay-' + key);
    if (!bay || openBay === bay) return;
    close(true);
    lastTrigger = triggerEl || $('.comp[data-key="' + key + '"]');
    clack(150, 0.06); haptic(8);
    extractGhost($('.comp[data-key="' + key + '"]'), function () {
      bay.hidden = false;
      requestAnimationFrame(function () { bay.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
      openBay = bay;
      markOpened(key);
      armLazy(bay);
      armGauge(bay);
      var closeBtn = $('.bay-close', bay);
      if (closeBtn) closeBtn.focus();
      try { history.replaceState(null, '', '#' + key); } catch (e) {}
    });
  }

  function close(silent) {
    if (!openBay) return;
    var bay = openBay; openBay = null;
    bay.classList.remove('is-open');
    if (!silent) { clack(190, 0.05); }
    setTimeout(function () { bay.hidden = true; $('.bay-scroll', bay).scrollTop = 0; }, 360);
    document.body.style.overflow = '';
    if (lastTrigger && lastTrigger.focus && !silent) lastTrigger.focus();
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }

  $$('.comp[data-key]').forEach(function (comp) {
    comp.addEventListener('click', function () { open(comp.dataset.key, comp); });
    comp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(comp.dataset.key, comp); }
    });
  });
  $$('.bay-close').forEach(function (b) { b.addEventListener('click', function () { close(); }); });
  $$('.bay-next-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = b.dataset.next;
      close(true);
      setTimeout(function () { open(next); }, 80);
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); hideMinimap(); } });

  /* deep links: teardown.html#pkit opens the bay directly */
  if (location.hash) {
    var k = location.hash.slice(1);
    if ($('#bay-' + k)) setTimeout(function () { open(k); }, 400);
  }

  /* ════════ 5 · DEPTH GAUGE per bay ════════ */
  function armGauge(bay) {
    if (bay.dataset.gauged) return;
    bay.dataset.gauged = '1';
    var scroll = $('.bay-scroll', bay);
    var strata = $$('.stratum', bay);
    var btns = $$('.bay-gauge button', bay);

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = $('.stratum[data-stratum="' + btn.dataset.stratum + '"]', bay);
        if (target) scroll.scrollTo({ top: target.offsetTop - 40, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    var sigCounted = false;
    scroll.addEventListener('scroll', function () {
      var mid = scroll.scrollTop + scroll.clientHeight * 0.45;
      var current = strata[0];
      strata.forEach(function (s) { if (s.offsetTop <= mid) current = s; });
      btns.forEach(function (b) { b.classList.toggle('is-active', b.dataset.stratum === current.dataset.stratum); });
      if (current.dataset.stratum === 'signature' && !sigCounted) {
        sigCounted = true;
        try {
          var n = parseInt(localStorage.getItem('td-sig-reads') || '0', 10) + 1;
          localStorage.setItem('td-sig-reads', String(n));
        } catch (e) {}
      }
    }, { passive: true });
  }

  /* ════════ 6 · NAV: goto buttons, minimap ════════ */
  function goTo(sel) {
    close(true);
    var el = $(sel);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); goTo(b.dataset.goto); hideMinimap(); });
  });
  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && b.tagName !== 'BUTTON') { e.preventDefault(); goTo(b.dataset.goto); }
    });
  });

  var mmBtn = $('#minimap-btn'), minimap = $('#minimap');
  function hideMinimap() {
    if (!minimap || minimap.hidden) return;
    minimap.hidden = true; mmBtn.setAttribute('aria-expanded', 'false');
  }
  if (mmBtn && minimap) {
    mmBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (minimap.hidden) {
        minimap.hidden = false;
        mmBtn.setAttribute('aria-expanded', 'true');
        clack(260, 0.04);
        /* staggered bloom */
        minimap.classList.add('mm-anim');
        $$('.mm-part', minimap).forEach(function (p, i) {
          setTimeout(function () { p.style.opacity = '1'; p.style.transform = 'none'; }, 30 * i);
        });
        setTimeout(function () { minimap.classList.remove('mm-anim'); }, 600);
      } else hideMinimap();
    });
    $$('.mm-part[data-open]', minimap).forEach(function (p) {
      p.addEventListener('click', function () { hideMinimap(); open(p.dataset.open); });
    });
    document.addEventListener('click', function (e) {
      if (!minimap.hidden && !minimap.contains(e.target)) hideMinimap();
    });
  }

  /* ════════ 7 · MANUAL MODE — the accessibility contract ════════ */
  var manualBtn = $('#manual-toggle');
  function setManual(on) {
    document.body.classList.toggle('manual', on);
    manualBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem('td-manual', on ? '1' : ''); } catch (e) {}
    if (on) {
      /* in manual mode every bay becomes part of the document flow */
      $$('.bay').forEach(function (b) {
        b.hidden = false; b.classList.add('is-open');
        b.style.position = 'static'; b.style.opacity = '1';
        var sc = $('.bay-scroll', b); sc.style.position = 'static'; sc.style.overflow = 'visible';
        var g = $('.bay-gauge', b); if (g) g.style.display = 'none';
        var c = $('.bay-close', b); if (c) c.style.display = 'none';
        armLazy(b);
      });
      document.body.style.overflow = '';
      openBay = null;
    } else {
      $$('.bay').forEach(function (b) {
        b.hidden = true; b.classList.remove('is-open');
        b.style.position = ''; b.style.opacity = '';
        var sc = $('.bay-scroll', b); sc.style.position = ''; sc.style.overflow = '';
        var g = $('.bay-gauge', b); if (g) g.style.display = '';
        var c = $('.bay-close', b); if (c) c.style.display = '';
      });
    }
  }
  if (manualBtn) {
    manualBtn.addEventListener('click', function () {
      setManual(!document.body.classList.contains('manual'));
    });
    try { if (localStorage.getItem('td-manual') === '1') setManual(true); } catch (e) {}
  }

  /* ════════ 8 · DROPPED SCREW — once per session ════════ */
  function dropScrew() {
    try { if (sessionStorage.getItem('td-screw')) return; sessionStorage.setItem('td-screw', '1'); } catch (e) {}
    if (reduceMotion || document.body.classList.contains('manual')) return;
    var s = document.createElement('div');
    s.id = 'dropped-screw';
    s.title = 'Every teardown loses one. — N.';
    document.body.appendChild(s);
    requestAnimationFrame(function () { s.classList.add('fall'); });
    clack(120, 0.04);
    s.addEventListener('click', function () {
      var tip = $('#screw-tip');
      if (tip) { tip.remove(); return; }
      tip = document.createElement('p');
      tip.id = 'screw-tip';
      tip.textContent = 'Every teardown loses one. — N.';
      document.body.appendChild(tip);
      setTimeout(function () { tip.remove(); }, 4000);
    });
  }
  setTimeout(dropScrew, 45000);

  /* ════════ 9 · UNDERSIDE — flip-in + burn-in counter ════════ */
  var plate = $('.us-plate');
  if (plate && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { plate.classList.add('is-flipped'); clack(140, 0.05); obs.disconnect(); }
      });
    }, { threshold: 0.4 }).observe(plate);
  } else if (plate) plate.classList.add('is-flipped');

  try {
    var opens = parseInt(localStorage.getItem('td-opens') || '0', 10) + 1;
    localStorage.setItem('td-opens', String(opens));
    var sig = parseInt(localStorage.getItem('td-sig-reads') || '0', 10);
    var burn = $('#burnin');
    if (burn) {
      burn.textContent = 'THIS UNIT HAS BEEN OPENED ON THIS DEVICE ' + opens + (opens === 1 ? ' TIME.' : ' TIMES.') +
        (sig > 0 ? ' YOU REACHED THE SIGNATURE LAYER ' + sig + (sig === 1 ? ' TIME.' : ' TIMES.') : '');
    }
  } catch (e) {}

  /* ════════ 10 · SERVICE TICKET ════════ */
  var form = $('#ticket-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var part = (form.querySelector('input[name="part"]:checked') || {}).value || 'COLLABORATION';
      var msg = ($('#ticket-msg').value || '—').trim() || '—';
      var from = ($('#ticket-from').value || 'ANONYMOUS OPERATOR').trim() || 'ANONYMOUS OPERATOR';
      var num = '#' + String(Math.floor(400 + Math.random() * 599)).padStart(4, '0');

      $('#tk-num').textContent = num;
      $('#tk-part').textContent = part;
      $('#tk-from').textContent = from;
      $('#tk-msg').textContent = msg;

      var subject = 'SERVICE TICKET ' + num + ' — ' + part;
      var body = 'UNIT: NV-2026 / REV.04 — VELTRONI%0APART: ' + encodeURIComponent(part) +
        '%0AFROM: ' + encodeURIComponent(from) + '%0A%0AREQUEST:%0A' + encodeURIComponent(msg);
      $('#tk-send').href = 'mailto:nicolovel11@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + body;

      var out = $('#ticket-out');
      out.hidden = false;
      /* re-trigger the print animation */
      var t = $('.ticket', out);
      t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
      clack(300, 0.05); setTimeout(function () { clack(280, 0.04); }, 90); setTimeout(function () { clack(260, 0.04); }, 180);
      out.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  }
  /* "FILE A SERVICE REQUEST" buttons anywhere */
  $$('.js-ticket').forEach(function (b) {
    b.addEventListener('click', function () { close(true); goTo('#service'); });
  });

})();
