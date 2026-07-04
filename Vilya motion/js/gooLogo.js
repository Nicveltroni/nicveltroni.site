/* ------------------------------------------------------------------
   GooLogo — layer 2 · two-state liquid logo
   The two SVGs in logos/ are two states of the same mark:
   "logo 1" = disconnected (core + floating satellite nodes, distinct
   elements — used as the geometry source), "logo 2" = connected
   (fused via liquid joints — the visual reference for hover).

   Load: satellites are born detached, then spring softly inward to
   the core; the gooey filter grows organic viscous bridges that fuse
   them into one liquid piece — this is the resting state.
   Hover: they stretch and tear apart with an underdamped wobble,
   springing back out to the fully detached first state.
   Leave: they dock inward again, re-fusing into the nucleus.

   Classic script: expects GOO, LOGOS, LOGO_SOURCES from config.js.
   ------------------------------------------------------------------ */

const SVG_NS = 'http://www.w3.org/2000/svg';

class GooLogo {
  constructor(mount) {
    this.mount = mount;
    this.core = null;
    this.satellites = [];
    this.svg = null;
    this.connected = false;

    /* resting state is fused; hover tears it back to the detached first state */
    mount.addEventListener('pointerenter', () => this._setState(false));
    mount.addEventListener('pointerleave', () => this._setState(true));
  }

  /* recolor the liquid logo in place (theme toggle) */
  setColor(color) {
    if (!this.svg) return;
    this.svg.querySelectorAll('.goo, .goo [fill]').forEach(n => n.setAttribute('fill', color));
  }

  /* ---------- loading & DOM construction ---------- */

  async load() {
    let text = null;
    /* dynamic fetch of the disconnected-state SVG; blocked on file://,
       where the inline copy in LOGO_SOURCES takes over */
    if (location.protocol !== 'file:') {
      try {
        const res = await fetch(LOGOS.disconnected);
        if (res.ok) text = await res.text();
      } catch (_) { /* fall through to inline source */ }
    }
    if (text === null) text = LOGO_SOURCES.disconnected;

    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const src = doc.documentElement;
    if (src.querySelector('parsererror')) throw new Error('Invalid logo SVG');
    this._build(src);
  }

  _build(src) {
    this.mount.innerHTML = '';
    this.satellites.length = 0;

    const S = GOO.geomScale;
    let [vx, vy, vw, vh] = (src.getAttribute('viewBox') || '0 0 100 100')
      .split(/[\s,]+/).map(Number);
    vx *= S; vy *= S; vw *= S; vh *= S;
    const pad = GOO.pad;

    /* host svg: the liquid-glue filter wraps every part. feComposite
       "atop" keeps the source shapes crisp while the thresholded blur
       supplies the gooey bridges underneath. */
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox',
      `${vx - pad} ${vy - pad} ${vw + pad * 2} ${vh + pad * 2}`);
    svg.innerHTML = `
      <defs>
        <filter id="liquid-glue" filterUnits="userSpaceOnUse"
                x="${vx - pad}" y="${vy - pad}"
                width="${vw + pad * 2}" height="${vh + pad * 2}"
                color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${GOO.blur}" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="${GOO.alphaMatrix}" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
      <g class="goo" filter="url(#liquid-glue)" fill="${THEME.ink}"></g>`;
    const gooGroup = svg.querySelector('.goo');
    this.mount.appendChild(svg);
    this.svg = svg;

    /* every top-level vector shape becomes an independent part */
    const parts = [];
    for (const shape of src.querySelectorAll('rect, path, circle, ellipse, polygon')) {
      const node = shape.cloneNode(true);
      node.removeAttribute('class');
      node.setAttribute('fill', THEME.ink);
      const scaled = document.createElementNS(SVG_NS, 'g');
      scaled.setAttribute('transform', `scale(${S})`);
      scaled.appendChild(node);
      const g = document.createElementNS(SVG_NS, 'g');
      g.appendChild(scaled);
      gooGroup.appendChild(g);

      const bb = g.getBBox();
      parts.push({
        g,
        cx: bb.x + bb.width / 2,
        cy: bb.y + bb.height / 2,
        area: bb.width * bb.height,
      });
    }

    /* the central body is the largest shape; the rest are satellites */
    parts.sort((a, b) => b.area - a.area);
    this.core = parts[0];

    for (const p of parts.slice(1)) {
      const dx = p.cx - this.core.cx, dy = p.cy - this.core.cy;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      Object.assign(p, {
        outX: ux * GOO.pushOut * S,   // hover: detached, beyond goo reach
        outY: uy * GOO.pushOut * S,
        inX: -ux * GOO.pullIn * S,    // resting: back to the designed position plus a
        inY: -uy * GOO.pullIn * S,    // tiny nudge — bridges form at facing corners
        x: 0, y: 0, vx: 0, vy: 0,
        tx: 0, ty: 0,
        mode: 'release',
        timer: 0,
      });
      p.x = p.tx = p.outX;            // born detached, no intro animation
      p.y = p.ty = p.outY;
      this.satellites.push(p);
    }
  }

  /* ---------- hover state ---------- */

  _setState(connected, instant = false) {
    this.connected = connected;
    this.satellites.forEach((p, i) => {
      clearTimeout(p.timer);
      const apply = () => {
        p.mode = connected ? 'connect' : 'release';
        p.tx = connected ? p.inX : p.outX;
        p.ty = connected ? p.inY : p.outY;
        if (instant) { p.x = p.tx; p.y = p.ty; p.vx = 0; p.vy = 0; }
      };
      /* small stagger so nodes dock / tear one after another */
      if (instant) apply();
      else p.timer = setTimeout(apply, i * GOO.stagger);
    });
  }

  /* ---------- per-frame update ---------- */

  update(dt) {
    if (!this.satellites.length) return;
    dt = Math.min(dt, 1 / 30);

    for (const p of this.satellites) {
      /* viscous docking vs underdamped tear-away */
      const { k, c } = p.mode === 'connect' ? GOO.connect : GOO.release;
      p.vx += ((p.tx - p.x) * k - p.vx * c) * dt;
      p.vy += ((p.ty - p.y) * k - p.vy * c) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      /* liquid elongation along the velocity vector */
      const speed = Math.hypot(p.vx, p.vy);
      const e = Math.min(GOO.stretchMax, speed * GOO.stretchGain);
      let tf = `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`;
      if (e > 0.01) {
        const ccx = p.cx + p.x, ccy = p.cy + p.y;
        const a = (Math.atan2(p.vy, p.vx) * 180 / Math.PI).toFixed(1);
        tf = `translate(${ccx} ${ccy}) rotate(${a}) scale(${(1 + e).toFixed(3)} ${(1 - e * 0.6).toFixed(3)}) rotate(${-a}) translate(${-p.cx} ${-p.cy})`;
      }
      p.g.setAttribute('transform', tf);
    }
  }
}
