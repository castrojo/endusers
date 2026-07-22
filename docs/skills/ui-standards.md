# Skill: Frontend UI Standards

Docusaurus component and CSS guidelines for this site.

## Components

- One directory per component under `src/components/` with `index.js` and
  `styles.module.css` (CSS modules).
- Data-driven components read JSON from `data/` via `@site/data/...` imports
  (see `AwardsTimeline`, `ReferenceArchitectures`, `MetricsDashboard`).
- **Asset paths from data must go through `useBaseUrl`.** Raw `<img src>` or
  `<a href>` values taken from JSON break under the GitHub Pages
  `BASE_URL=/endusers/` prefix. Use `Link` from `@docusaurus/Link` for internal
  routes.
- Avoid spread of Map/Set iterators (`[...map.keys()]`) — Babel loose mode compiles it
  to `[].concat(...)`, which crashes at hydration. Use `Array.from()`.

## Global styles

- Global rules live in `src/css/custom.css` (Infima variables, Clarity City fonts).
- Reusable landing-page classes: `.hero-photo` (full-width figure with rounded
  corners, shadow, and caption) and `.hero-tagline` (headline subtitle treatment).

## Images

- Self-host images under `static/img/`; never hotlink GitHub user-attachments
  (they can require auth and 404 for anonymous visitors).
- Compress photos to progressive JPEG before committing; give `<img>` explicit
  `width`/`height` to avoid layout shift.

## Verification

- Build with `npm run build` (broken links fail the build).
- Never claim a presentation change works from code alone; verify the rendered page
  with a browser screenshot, including a `BASE_URL=/endusers/` build when asset paths
  are involved.
