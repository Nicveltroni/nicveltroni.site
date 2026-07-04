# VILYA — Liquid Halftone Motion

A dependency-free front-end component replicating the reference clip
(`assets/motion example for vilya.mp4`): a halftone wave field on canvas
behind a liquid/metaball treatment of the Vilya logo SVGs. On load the
logo fuses softly into the nucleus; hovering tears it back to the
detached first state.

## Run

Double-click `index.html` — it works directly from disk. The scripts are
classic (non-module) and the logo SVGs fall back to inline copies in
`js/config.js` when `fetch` is blocked on `file://`.

Served over HTTP (double-click `START.bat`, or `python -m http.server`),
the SVGs in `logos/` are fetched dynamically instead, so editing those
files is picked up without touching the code.

## Structure

| File | Role |
|---|---|
| `index.html` | Layers + HUD, no inline logic |
| `START.bat` | Optional: serves the folder over HTTP and opens the browser |
| `css/style.css` | 1-bit palette, layout, HUD |
| `js/config.js` | **All tuning lives here** — logo paths + inline fallbacks, field, physics |
| `js/halftone.js` | Layer 1 — canvas grid, value-noise + diagonal sine front |
| `js/gooLogo.js` | Layer 2 — SVG fetch/inject, gooey filter, hover physics, spray |
| `js/main.js` | Boot, shared rAF loop, variant switcher |

## How it works

**Background** — one canvas, one `requestAnimationFrame`. The classic
halftone machinery (a grid of white squares whose size is modulated by
a field, quantized to whole pixels) draws a molecular honeycomb: each
dot measures its distance to the nearest side of a hexagonal lattice,
and that side (bond) has its own life — bonds switch on and off
individually inside slowly drifting noise clusters, so rings assemble,
link up and break apart bond by bond, with atom accents at the corners
where live bonds meet. A radial falloff keeps the area behind the logo
black. The faint resting grid is pre-rendered once per resize.

**Logo** — the SVG named in `config.js` is fetched, parsed, and every
top-level vector shape is wrapped in its own `<g>` inside a group
filtered by:

```xml
<feGaussianBlur stdDeviation="10" />
<feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" />
```

Geometry is upscaled (`geomScale`) inside the filter's user space so the
spec blur rounds corners and bridges gaps without dissolving the small
shapes. Each part runs a damped spring: a *viscous* parameter set while
chasing the pointer (no overshoot, liquid lag) and an *underdamped* set
when snapping home (organic wobble, clean release). Velocity stretches
each part along its motion vector for the mercury deformation, and crisp
spray squares are shed in the tension zone where bridges form and tear —
they live in a second, unfiltered SVG overlay.

When the pointer is idle for ~2.6 s an autopilot reproduces the 0:11–0:23
choreography of the reference: a random part glides into a sibling,
fuses with a viscous jitter, then snaps back.

## Switching logos

- UI: the `01 / 02` buttons (bottom-left), or
- URL: `?logo=logo1` / `?logo=logo2`, or
- Code: add entries to `LOGOS` in `js/config.js` — any SVG whose
  top-level shapes should move independently will work as-is.
