/* ------------------------------------------------------------------
   Central configuration — switch logos / tune motion from one place.
   Classic script (no modules) so the page also runs from file://.
   ------------------------------------------------------------------ */

/* The two SVGs are two states of the same mark: "disconnected" is the
   geometry source (core + separate satellite nodes); "connected" is
   the fused-state visual reference the hover interaction recreates. */
const LOGOS = {
  disconnected: 'logos/logo 1.svg',
  connected: 'logos/logo 2.svg',
};

/* Inline copies of the logo sources, used as fallback when the page is
   opened via double click (file://), where fetch() is blocked. Over
   HTTP the SVGs in logos/ are fetched dynamically and these are unused. */
const LOGO_SOURCES = {
  disconnected: `<svg id="Livello_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 263.55 220.66">
  <g id="Livello_1-2">
    <rect fill="#fff" x="225.68" y="11.34" width="25.81" height="49.92" rx="5.5" ry="5.5" transform="translate(274.88 -202.28) rotate(90)"/>
    <rect fill="#fff" x="12.34" y="131.89" width="25.81" height="50.49" rx="5.5" ry="5.5" transform="translate(182.38 131.89) rotate(90)"/>
    <path fill="#fff" d="M188.38,43.67v-12.36c0-3.04-2.46-5.5-5.5-5.5h-14.81c-3.04,0-5.5,2.46-5.5,5.5v12.36c0,3.04-2.46,5.5-5.5,5.5h-52.33c-6.08,0-11,4.92-11,11v52.75c0,3.04-2.46,5.5-5.5,5.5h-32.25c-3.04,0-5.5,2.46-5.5,5.5v14.81c0,3.04,2.46,5.5,5.5,5.5h32.25c3.04,0,5.5,2.46,5.5,5.5v40.62c0,3.04,2.46,5.5,5.5,5.5h14.81c3.04,0,5.5-2.46,5.5-5.5v-40.62c0-3.04,2.46-5.5,5.5-5.5h52.33c6.08,0,11-4.92,11-11v-60.9c0-3.04,2.46-5.5,5.5-5.5h14.24c3.04,0,5.5-2.46,5.5-5.5v-6.66c0-3.04-2.46-5.5-5.5-5.5h-14.24c-3.04,0-5.5-2.46-5.5-5.5ZM157.07,74.98c3.04,0,5.5,2.46,5.5,5.5v32.44c0,3.04-2.46,5.5-5.5,5.5h-32.14c-3.04,0-5.5-2.46-5.5-5.5v-32.44c0-3.04,2.46-5.5,5.5-5.5h32.14Z"/>
    <rect fill="#fff" x="136.75" y="0" width="25.81" height="25.81" rx="5.5" ry="5.5" transform="translate(162.57 -136.75) rotate(90)"/>
    <rect fill="#fff" x="119.55" y="194.85" width="25.81" height="25.81" rx="5.5" ry="5.5"/>
  </g>
</svg>`,
  connected: `<svg id="Livello_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 263.44 219.82">
  <g id="Livello_1-2">
    <path fill="#fff" d="M257.94,25.22h-38.59c-3.03,0-5.5,2.46-5.5,5.5v14.3c0,3.04-2.46,5.5-5.5,5.5h-14.5c-3.04,0-5.5-2.46-5.5-5.5v-15.2c0-2.54-2.06-4.6-4.6-4.6h0c-.29.05-.59.08-.9.08h-14.3c-.21,0-.43-.01-.63-.04-2.53-.28-4.53-2.28-4.82-4.8-.04-.21-.05-.44-.05-.66V5.5c0-.22.01-.45.05-.66-.33-2.73-2.65-4.84-5.46-4.84h-14.31c-3.04,0-5.5,2.46-5.5,5.5v14.3c0,2.73,2,5,4.6,5.42h15.21c.21,0,.42.01.63.04,2.52.29,4.53,2.28,4.83,4.8v.02c.03.21.04.42.04.64v19.8h-57.61c-6.08,0-11,4.92-11,11v52.02c0,3.04-2.46,5.5-5.5,5.5h-33.23c-3.04,0-5.5,2.46-5.5,5.5v14.3c0,3.04-2.46,5.5-5.5,5.5H5.5c-3.04,0-5.5,2.46-5.5,5.5v14.3c0,3.04,2.46,5.5,5.5,5.5h39.3c3.04,0,5.5-2.46,5.5-5.5v-14.3c0-3.04,2.46-5.5,5.5-5.5h33.23c3.04,0,5.5,2.46,5.5,5.5v39.18c0,3.04,2.46,5.5,5.5,5.5h14.3c3.04,0,5.5,2.46,5.5,5.5v14.3c0,3.04,2.47,5.5,5.5,5.5h14.31c3.03,0,5.5-2.46,5.5-5.5v-14.3c0-3.04-2.47-5.5-5.5-5.5h-14.31c-3.04,0-5.5-2.46-5.5-5.5v-39.18c0-3.04,2.46-5.5,5.5-5.5h52.02c6.08,0,11-4.92,11-11v-59.21c0-3.04,2.46-5.5,5.5-5.5h14.5c3.04,0,5.5-2.46,5.5-5.5v-7.11c0-3.04,2.47-5.5,5.5-5.5h38.59c3.04,0,5.5-2.46,5.5-5.5v-14.3c0-3.04-2.46-5.5-5.5-5.5ZM157.55,119.04h-32.22c-3.04,0-5.5-2.46-5.5-5.5v-32.22c0-3.04,2.46-5.5,5.5-5.5h32.22c3.04,0,5.5,2.46,5.5,5.5v32.22c0,3.04-2.46,5.5-5.5,5.5Z"/>
  </g>
</svg>`,
};

/* Theme colors — background + ink (grid dots, logo, HUD). "dark" is the
   original 1-bit look; "light" mirrors the alternate version (index-b).
   THEME is the live, mutable theme — the night/light toggle swaps its
   values and triggers a re-render. */
const THEMES = {
  dark:  { bg: '#000000', ink: '#ffffff' },
  light: { bg: '#f3efe7', ink: '#1a1814' },
};
const THEME = { ...THEMES.dark };

/* Palette presets. "current" is the approved neon palette — kept as a
   saved reference. "alt" is a free slot for trying variations: edit its
   colors and/or flip FIELD.palette below to test, without losing
   "current". The arrays don't need to match in length — the "two
   slices per color" zone logic in halftone.js adapts to pal.length. */
const PALETTES = {
  current: [
    [170,  90, 230],  // violet        (dominant)
    [220,  70, 200],  // magenta       (dominant)
    [235,  75, 130],  // rose
    [220,  80,  55],  // red-orange
    [240, 140,  70],  // coral orange  (dominant)
    [140, 210,  60],  // green
  ],
  alt: [
    [170,  90, 230],  // violet        (dominant)
    [220,  70, 200],  // magenta       (dominant)
    [235,  75, 130],  // rose
    [220,  80,  55],  // red-orange
    [240, 140,  70],  // coral orange  (dominant)
    [140, 210,  60],  // green
    [245, 220,  80],  // yellow
    [ 60, 210, 240],  // bright cyan / celeste
  ],
};

/* Background halftone field */
const FIELD = {
  spacing: 9,         // grid pitch, CSS px (finer = smoother halftone ramps)
  maxDPR: 2,          // cap devicePixelRatio for perf
  baseDotSize: 1,     // faint static grid dots
  baseDotAlpha: 0.18,
  dotAlpha: 0.45,     // opacity of the field dots — keeps the logo in front
  timeScale: 1.05,    // global speed of the field
  hexRadius: 165,     // circumradius of each hexagonal ring, px
  edgeWidth: 14,      // bond gradient scale, px (ramp spans ~3.8× this)
  vertexRadius: 19,   // atom gradient scale at ring corners, px
  warp: 48,           // lattice distortion, px — rings waver instead of sitting rigid
  clusterScale: 0.0017, // spatial size of active molecule clusters (lower = larger)
  clusterDrift: 0.20, // how fast clusters travel across the screen
  frontLength: 820,   // spatial period of the growth front, px (region built at once)
  frontSpeed: 0.18,   // cycles/s — one build→hold→dissolve every ~5s per region
  stagger: 0.06,      // per-bond phase offset: rings close bond-by-bond, not all at once
  ambient: 0.27,      // halftone mid-tone shimmer inside active clusters

  /* neon palette sampled from the reference: violet/magenta and coral
     dominate, plus a green accent — no white/gray, every dot stays
     colored. The 6 hues are spread across a violet → magenta → rose →
     red-orange → coral → green arc (similar brightness too), so no two
     are near-duplicates and none reads as washed out. Every hue,
     including green, is chosen by the same slow zone noise with equal
     weight, so all colors gather into coherent regions of the same size
     and shape — green behaves exactly like every other color.
     Switch to PALETTES.alt here to test a variant; PALETTES.current
     stays untouched as the saved reference. */
  palette: PALETTES.alt,
  paletteScale: 0.0018, // spatial size of color zones (lower = larger regions)
  paletteDrift: 0.012,  // how fast color zones drift
  coreWhiten: 0,        // 0 = cores stay colored, no wash toward white
};

/* Liquid logo physics — two-state hover transition */
const GOO = {
  blur: 8,                        // feGaussianBlur stdDeviation (spec)
  alphaMatrix: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9', // threshold (spec)
  geomScale: 2,                   // upscale injected geometry inside the filter's
                                  // user space so the blur rounds corners and
                                  // bridges gaps without dissolving small shapes
  pad: 160,                       // extra viewBox room for travel + blur, svg units

  pushOut: 26,                    // idle detach distance, source units — beyond goo reach
  pullIn: 4,                      // hover: tiny inward nudge past the natural position —
                                  // the goo bridges only at the facing corners, the
                                  // nodes stay distinct (no blob)

  connect: { k: 50,  c: 8 },      // viscous docking (slight squish, no harsh snap)
  release: { k: 110, c: 9 },      // underdamped tear-away (stretch, wobble, clean break)
  stagger: 70,                    // ms between satellites starting to move

  stretchGain: 0.00045,           // velocity → liquid elongation
  stretchMax: 0.45,
};
