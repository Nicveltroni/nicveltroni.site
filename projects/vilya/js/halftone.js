/* ------------------------------------------------------------------
   HalftoneField — layer 1
   The same halftone machinery as before — a grid of squares on black
   whose size is modulated by a field, tinted from a neon palette
   (config.js) by zone — but the field now draws
   a molecular honeycomb: hexagonal rings whose sides (bonds) switch
   on and off individually inside slowly drifting clusters, so the
   structures assemble, link up and break apart bond by bond, with
   atom accents at the ring corners. A radial "hole" keeps the zone
   behind the logo dark.
   Classic script: expects FIELD from config.js, loaded first.
   ------------------------------------------------------------------ */

/* '#rrggbb' -> 'rgba(r,g,b,a)' */
function hexToRgba(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

/* fast integer hash → [0,1) */
function hash2(ix, iy) {
  let h = Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iy, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* 2D value noise, smoothstep-interpolated */
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy),     b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function sstep(a, b, x) {
  x = (x - a) / (b - a);
  if (x < 0) x = 0; else if (x > 1) x = 1;
  return x * x * (3 - 2 * x);
}

/* asymmetric life cycle of a bond, phase p in [0,1):
   build up (0–0.20) → hold complete (0.20–0.62) → dissolve (0.62–1) */
function lifePulse(p) {
  if (p < 0.20) return sstep(0, 0.20, p);
  if (p < 0.62) return 1;
  return 1 - sstep(0.62, 1, p);
}

const COS30 = 0.8660254;

class HalftoneField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.base = document.createElement('canvas');   // static faint grid, pre-rendered
    this.bondCache = new Map();                     // per-frame bond life values
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, FIELD.maxDPR);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.dpr = dpr;

    this.canvas.width  = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);

    const s = FIELD.spacing;
    this.cols = Math.ceil(this.w / s) + 1;
    this.rows = Math.ceil(this.h / s) + 1;
    this.cx = this.w / 2;
    this.cy = this.h / 2;

    /* pre-render the faint resting grid once per resize */
    this.base.width  = this.canvas.width;
    this.base.height = this.canvas.height;
    const bctx = this.base.getContext('2d');
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.fillStyle = THEME.bg;
    bctx.fillRect(0, 0, this.w, this.h);
    bctx.fillStyle = hexToRgba(THEME.ink, FIELD.baseDotAlpha);
    const bs = FIELD.baseDotSize;
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        bctx.fillRect(i * s - bs / 2, j * s - bs / 2, bs, bs);
      }
    }
  }

  /* life of one bond (hexagon side), keyed by its midpoint, cached per
     frame. The same bond is shared by two rings, so keying on the
     midpoint keeps both sides in agreement. */
  _bondLife(mx, my, t) {
    const kx = Math.round(mx), ky = Math.round(my);
    const key = kx * 131071 + ky;
    let life = this.bondCache.get(key);
    if (life !== undefined) return life;

    /* drifting cluster mask: which region of the screen hosts an
       active "molecule" right now — wide and slow, so it never cuts
       a ring down while the growth front is still building it */
    const cl = vnoise(kx * FIELD.clusterScale + t * FIELD.clusterDrift,
                      ky * FIELD.clusterScale - t * FIELD.clusterDrift * 0.7);
    const m = sstep(0.34, 0.56, cl);

    /* connected growth front: a bond's life is its position along a
       travelling phase wave warped by static noise. Neighbouring bonds
       share nearly the same phase (plus a tiny stagger), so structures
       assemble bond-by-bond into complete rings, hold, then dissolve
       from the trailing side while new ones grow attached ahead */
    let life2 = 0;
    if (m > 0.01) {
      const h = hash2(kx, ky);
      const warp = vnoise(kx * 0.0016, ky * 0.0016);
      let p = (kx * 0.78 + ky * 0.62) / FIELD.frontLength
            + warp * 0.55 + h * FIELD.stagger - t * FIELD.frontSpeed;
      p -= Math.floor(p);
      life2 = m * lifePulse(p);
    }
    this.bondCache.set(key, life2);
    return life2;
  }

  /** t — elapsed seconds */
  render(t) {
    const { ctx, cols, rows, dpr } = this;
    const s = FIELD.spacing;
    t *= FIELD.timeScale;
    this.bondCache.clear();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* dots are tinted per-dot from the neon palette below; alpha keeps the
       field sitting back so the logo reads as the bright foreground layer */
    const pal = FIELD.palette;
    const da = FIELD.dotAlpha;
    const cw = FIELD.coreWhiten;

    const maxSize  = s - 1;
    const R  = FIELD.hexRadius;       // ring circumradius
    const RI = R * COS30;             // ring inradius
    const ew = FIELD.edgeWidth;
    const vr = FIELD.vertexRadius;
    const SIXTH = Math.PI / 3;

    for (let j = 0; j < rows; j++) {
      const y = j * s;
      for (let i = 0; i < cols; i++) {
        const x = i * s;

        /* --- warp the lattice so rings waver instead of sitting rigid --- */
        const wAmp = FIELD.warp;
        const wx = x + (vnoise(x * 0.006 + t * 0.35, y * 0.006 + 7.3) - 0.5) * wAmp;
        const wy = y + (vnoise(x * 0.006 - 3.1, y * 0.006 + t * 0.28) - 0.5) * wAmp;

        /* --- locate the honeycomb cell (axial coords, cube rounding) --- */
        const qf = (2 / 3) * wx / R;
        const rf = (-wx / 3 + wy / 1.7320508) / R;
        let q = Math.round(qf), r = Math.round(rf);
        const sf = -qf - rf, sc = Math.round(sf);
        const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(sc - sf);
        if (dq > dr && dq > ds) q = -r - sc; else if (dr > ds) r = -q - sc;
        const ccx = R * 1.5 * q;
        const ccy = R * 1.7320508 * (r + q * 0.5);
        const px = wx - ccx, py = wy - ccy;

        /* --- nearest side of the ring (flat-top hexagon) --- */
        const pa = COS30 * px + 0.5 * py;
        const pb = py;
        const pc = -COS30 * px + 0.5 * py;
        const aa = Math.abs(pa), ab = Math.abs(pb), ac = Math.abs(pc);
        let nx, ny, dd;
        if (aa >= ab && aa >= ac)      { const sg = pa >= 0 ? 1 : -1; nx =  COS30 * sg; ny = 0.5 * sg; dd = aa; }
        else if (ab >= ac)             { const sg = pb >= 0 ? 1 : -1; nx = 0;           ny = sg;       dd = ab; }
        else                           { const sg = pc >= 0 ? 1 : -1; nx = -COS30 * sg; ny = 0.5 * sg; dd = ac; }

        /* ambient halo: inside an active cluster the whole grid breathes
           with small/medium shimmering dots — the halftone mid-tones */
        let v = 0;
        const clp = vnoise(x * FIELD.clusterScale + t * FIELD.clusterDrift,
                           y * FIELD.clusterScale - t * FIELD.clusterDrift * 0.7);
        const mp = sstep(0.40, 0.68, clp);
        if (mp > 0.02) {
          const shimmer = vnoise(i * 0.33 - t * 1.2, j * 0.33 + t * 0.85);
          v = mp * shimmer * FIELD.ambient;
        }

        /* light grain veil — kept subtle so the size ramp stays readable */
        const tex = 0.78 + 0.34 * vnoise(i * 0.5 + t * 2.1, j * 0.5 - t * 1.6);

        /* bond as a soft bell of dot sizes: no stroke anywhere — the dots
           swell gradually toward the bond axis across many grid rows,
           and that ramp is what makes the side read as a lit tube */
        const ed = Math.abs(dd - RI);
        const bw = ew * 3.8;                       // gradient half-width
        if (ed < bw) {
          const life = this._bondLife(ccx + nx * RI, ccy + ny * RI, t);
          if (life > 0.01) {
            const bell = sstep(bw, 0, ed);
            const vb = life * bell * tex;
            if (vb > v) v = vb;
          }
        }

        /* atom at the ring corner: spherical radial gradient — bright
           highlight in the middle, shading away in every direction */
        const ang = Math.atan2(py, px);
        const va = Math.round(ang / SIXTH) * SIXTH;
        const vx = ccx + R * Math.cos(va), vy = ccy + R * Math.sin(va);
        const dv = Math.hypot(wx - vx, wy - vy);
        if (dv < vr * 2.6) {
          const l1 = this._bondLife(ccx + RI * Math.cos(va - SIXTH / 2),
                                    ccy + RI * Math.sin(va - SIXTH / 2), t);
          const l2 = this._bondLife(ccx + RI * Math.cos(va + SIXTH / 2),
                                    ccy + RI * Math.sin(va + SIXTH / 2), t);
          const vlife = Math.max(l1, l2);
          if (vlife > 0.01) {
            const sphere = sstep(vr * 2.6, 0, dv);
            const vb = vlife * sphere * tex;
            if (vb > v) v = vb;
          }
        }
        if (v <= 0.02) continue;
        if (v > 1) v = 1;
        /* tone curve: lift the mid sizes so the form lives in the
           gradation, with full squares only at the very peak */
        v = Math.pow(v, 0.66);

        /* continuous sizes: the ramp stays liquid, no stepping */
        const size = v * maxSize;
        if (size < 0.8) continue;

        /* hue from a slow, low-frequency zone noise so colors gather into
           coherent regions like the reference. Every palette entry gets
           two non-adjacent slices of the noise range (mod pal.length) —
           same formula, same weight for all. A single slice per color can
           drift out of the visible range for a long stretch (the noise
           field translates roughly along a line); two slices per color
           means each color always has a slice nearby, so green shows up
           reliably without being treated any differently from the rest. */
        const cn = vnoise(x * FIELD.paletteScale + t * FIELD.paletteDrift,
                          y * FIELD.paletteScale - t * FIELD.paletteDrift);
        const slices = pal.length * 2;
        let ci = (cn * slices) | 0;
        if (ci >= slices) ci = slices - 1;
        ci %= pal.length;
        const col = pal[ci];

        const wm = sstep(0.75, 1, v) * cw;        // near-peak cores brighten
        const cr = (col[0] + (255 - col[0]) * wm) | 0;
        const cg = (col[1] + (255 - col[1]) * wm) | 0;
        const cb = (col[2] + (255 - col[2]) * wm) | 0;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${da})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
  }
}
