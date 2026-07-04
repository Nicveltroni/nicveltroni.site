/* ------------------------------------------------------------------
   Boot: one shared requestAnimationFrame drives both layers.
   Classic script: expects config.js, halftone.js, gooLogo.js first.
   ------------------------------------------------------------------ */

(async function init() {
  const field = new HalftoneField(document.getElementById('halftone'));
  const logo = new GooLogo(document.getElementById('logo-mount'));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let resizeQueued = false;
  window.addEventListener('resize', () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { field.resize(); resizeQueued = false; });
  });

  /* main loop */
  let last = performance.now();
  let elapsed = 0;

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!reduceMotion) elapsed += dt;

    field.render(elapsed);
    logo.update(reduceMotion ? 0 : dt);

    requestAnimationFrame(frame);
  }

  /* night / light theme toggle — swaps THEME in place and re-renders
     the static grid layer + recolors the logo, no reload needed.
     Only present on index.html; index-b.html has no #theme-toggle and
     always stays on the dark theme. */
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  function applyTheme(name) {
    Object.assign(THEME, THEMES[name]);
    root.style.setProperty('--bg', THEME.bg);
    root.style.setProperty('--ink', THEME.ink);
    document.body.classList.toggle('theme-light', name === 'light');
    if (FIELD.paletteByTheme) FIELD.palette = FIELD.paletteByTheme[name];
    field.resize();
    logo.setColor(THEME.ink);
    if (toggle) toggle.setAttribute('aria-pressed', String(name === 'light'));
    localStorage.setItem('vilya-theme', name);
  }

  if (toggle) {
    /* circular reveal wipe, expanding from the toggle, via the View
       Transitions API. Falls back to a plain instant swap on browsers
       that don't support it (Firefox / Safari < 18). */
    toggle.addEventListener('click', () => {
      const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';

      if (reduceMotion) {
        applyTheme(next);
        return;
      }

      const r = toggle.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const endRadius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y)
      );

      /* freeze a full copy of the CURRENT (old) visual state — halftone
         canvas, logo, HUD text — into one overlay, apply the new theme
         live underneath, then grow a transparent hole in the overlay
         from the toggle outward so every layer is revealed together,
         in place, with nothing popping in/out at the end. */
      const oldBg = THEME.bg;

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;pointer-events:none;background:' + oldBg;

      const halftoneEl = document.getElementById('halftone');
      const snap = document.createElement('canvas');
      snap.width = halftoneEl.width;
      snap.height = halftoneEl.height;
      snap.getContext('2d').drawImage(halftoneEl, 0, 0);
      snap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
      overlay.appendChild(snap);

      const stageEl = document.getElementById('stage');
      if (stageEl) {
        const stageClone = stageEl.cloneNode(true);
        stageClone.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;';
        overlay.appendChild(stageClone);
      }

      /* keep original classes so fixed top/left/bottom/right come from
         the stylesheet untouched — pixel-identical to the live element,
         no rect-based rounding drift. Only freeze the color inline. */
      document.querySelectorAll('.hud').forEach((el) => {
        const cs = getComputedStyle(el);
        const clone = el.cloneNode(true);
        clone.style.color = cs.color;
        overlay.appendChild(clone);
      });

      document.body.appendChild(overlay);

      applyTheme(next);

      const duration = 600;
      let startTime = null;
      function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

      function step(now) {
        if (!startTime) startTime = now;
        const p = Math.min((now - startTime) / duration, 1);
        const radius = endRadius * easeInOut(p);
        const mask = `radial-gradient(circle ${radius}px at ${x}px ${y}px, transparent 99.9%, black 100%)`;
        overlay.style.maskImage = mask;
        overlay.style.webkitMaskImage = mask;
        if (p < 1) requestAnimationFrame(step);
        else overlay.remove();
      }

      requestAnimationFrame(step);
    });

    applyTheme(localStorage.getItem('vilya-theme') === 'light' ? 'light' : 'dark');
  } else {
    applyTheme('dark');
  }

  await logo.load();
  /* resting state is fused to the nucleus; satellites ease in softly on
     load (instantly when reduced motion is requested) */
  logo._setState(true, reduceMotion);
  /* QA hook: force the detached first state via ?state=disconnected */
  if (new URLSearchParams(location.search).get('state') === 'disconnected') {
    logo._setState(false, true);
  }
  requestAnimationFrame(frame);

  /* VILYA brand click → notify parent to close the panel */
  const hudTL = document.querySelector('.hud--tl');
  if (hudTL) hudTL.addEventListener('click', () => {
    window.parent.postMessage({ action: 'close-vilya' }, '*');
  });
})();
