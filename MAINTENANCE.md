# Gwanox Site Maintenance

This is a static site. Keep the raw HTML crawlable; use JavaScript only for motion and easter eggs.

## File Map

- `index.html` - visible content, metadata, JSON-LD, inline SVG filters.
- `warframe-pvp-discord-conclave/index.html` - readable SEO page for the Warframe PvP Discord / Conclave Reignited community.
- `warframe-pvp/index.html` - readable SEO landing page for Warframe PvP searches.
- `conclave_guide/index.html` - readable Conclave guide page linked from the homepage.
- `assets/css/site.css` - visual system. Start at `[TOKENS]` for layout, spacing, opacity, and motion tuning.
- `assets/css/seo-pages.css` - shared styling for readable SEO pages.
- `assets/js/site.js` - interactions. Start at `[CONFIG]` for trace, tilt, lab, aim game, and readout timing.
- `assets/fonts/` - self-hosted type. `ArchivoBlack` is the display title face; `AzeretMono` is the micro/terminal face.
- `assets/logos/*.png` - link-card logo PNGs. Keep them square, high contrast, and let `.logo-filter` recolor them.
- `assets/seo/*` - social preview images. The Discord page already points at `gwanox-warframe-pvp-discord-conclave-og.png`; replace with final raster art when ready.
- `llms.txt` - short AI/search summary. Keep this aligned with the page copy.
- `sitemap.xml` - crawl map for the four canonical pages. Keep priorities ordered: home, Warframe PvP Discord, Conclave guide, Warframe PvP.
- `CNAME` - GitHub Pages custom domain for `gwanox.com`.
- `.nojekyll` - tells GitHub Pages to serve this as plain static files.
- `.tools/check-site.ps1` - local drift check after edits.

## Common Edits

### Change Copy

Edit the visible text in `index.html` under `[VISIBLE CONTENT]`. If the meaning changes, also update:

- `<title>` and `<meta name="description">`
- Open Graph/Twitter descriptions
- JSON-LD `description`, `keywords`, and `ItemList`
- the short `[SEMANTIC INDEX]` summary
- `llms.txt`

### Add A Link Card

1. Add a visible card in `index.html` under `[LINK CARDS]`:

```html
<a class="channel" href="https://example.com" target="_blank" rel="noopener noreferrer me" data-status="Kind / concise status" data-id="example">
  <img class="mark mark-img logo-filter" src="assets/logos/example.png" alt="" width="128" height="128" decoding="async" aria-hidden="true">
  <strong>Example</strong>
  <small>Short label</small>
</a>
```

2. Add the matching PNG to `assets/logos/`.
3. Add the same name and URL to the JSON-LD `ItemList`, preserving the visible order.
4. Add identity links to `sameAs` only when the link is an official Gwanox profile, not a resource.
5. Use canonical trailing slashes for internal page routes, such as `/conclave_guide/`.
6. Run `.\.tools\check-site.ps1`.

### Sitelink Candidates

The homepage includes a `SiteNavigationElement`, a `#priority-pages` JSON-LD ItemList, and an accessible `.sitelink-nav` block. Keep all three in sitemap priority order:

1. `/warframe-pvp-discord-conclave/`
2. `/conclave_guide/`
3. `/warframe-pvp/`

### Tune Visuals

Use `assets/css/site.css`:

- `[TOKENS]` - panel size, gaps, link card dimensions, ticker/scope opacity.
- `[CONTENT]` - title, copy, image frames, status rail.
- `[LINKS]` - card layout, icon sizing, hover feel.
- `[RESPONSIVE]` - mobile and portrait behavior.

Keep the palette to `#141513` and `#c4cabd`.

Typography is intentionally locked to local font roles: `Gwanox Display` for large title text, `Gwanox Micro` for terminal/micrographic text. Avoid system font stacks or extra imports unless the type system is being reconsidered.

### Tune Motion

Use `assets/js/site.js`:

- `[CONFIG].trace` - grid trail life, sample rate, grid spacing.
- `[CONFIG].tilt` - mouse and accelerometer tilt strength.
- `[CONFIG].aim` - bubble sizes, life, spawn ramp, copy format.
- `[CONFIG].readout` - idle reset and link ping timing.

### Tune Image Filter

Type `LAB` into the footer access box. Current saved values:

```text
gamma=1.16 lift=0.10 cutoff=41 table=0 0 0 0 0 1 1 1 1 1 1 1
```

When final, remove or hide the lab controls if you do not want visitors to find them.

## Before Publishing

Run:

```powershell
.\tools\check-site.ps1
```

Then verify in a browser:

- dark and light theme
- portrait/mobile layout
- link-card hover/readout
- `LAB` opens and closes
- aim trainer starts, ends, and copies a score
- social preview images are real final images, not placeholders
- `/warframe-pvp-discord-conclave/`, `/conclave_guide/` and `/warframe-pvp/` are listed in `sitemap.xml` with `lastmod`

## GitHub Pages

This repo can publish directly from the branch root. Keep `index.html`, `robots.txt`, `sitemap.xml`, `llms.txt`, `CNAME`, and `.nojekyll` at the repository root.

Canonical internal page links should include the trailing slash, for example `/conclave_guide/`, so GitHub Pages resolves directly to the route directory.
