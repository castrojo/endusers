# Contributing to endusers.cncf.io

Thanks for your interest in contributing to the CNCF End User Community site.
This document covers the development workflow and the data contribution model.

## Development setup

Prerequisites: Node.js 22+ (LTS recommended) and npm.

```bash
npm install
npm run docus:start
```

The dev server runs at `http://localhost:3000`. In the devcontainer:

```bash
npm run docusaurus start -- --host 0.0.0.0 --port 3000 --poll 10000
```

## Content audience

Content on this site speaks to **end users** — the practitioners, architects,
and organizations adopting cloud native — not to project contributors, who are
served by [contribute.cncf.io](https://contribute.cncf.io/). Keep this audience
in mind for every page.

## Data contribution model

Most pages are generated from data files. Contribute by editing the data, not
by hand-building pages:

| Page | Data source | Validation |
|---|---|---|
| `/awards` | `data/awards.json` | `npm run validate:awards` |
| `/metrics` | `data/metrics.json` (generated) | `npm run validate:metrics` |
| `/architectures` | `data/architectures/records/*.json` | `npm run validate:architectures` |

Rules:

- **Never edit `data/metrics.json` by hand.** Refresh it with
  `npm run collect:metrics`; change `scripts/collect-metrics.mjs` instead.
- Verify award entries against the linked cncf.io announcement before adding.
- Reference architectures are imported from
  [cncf/architecture](https://github.com/cncf/architecture) — fix content
  upstream, then re-import.
- Verify CNCF facts (award winners, TAB scope, architecture counts) against
  authoritative sources. Never assert numbers without a source.

## Style rules

- GitHub Flavored Markdown for all content.
- No emojis in content, code, or commit messages.
- Maintain the Docusaurus layout and `sidebars.js` configuration. Single-page
  sections (practitioners, events, metrics, awards) intentionally have no
  sidebar; multi-page sections (architectures, community) do.

## Making changes

1. Fork the repository and create a branch from `main`.
2. Make your change and run the relevant validation script.
3. Verify with `npm run build` before opening a PR.
4. Open a pull request against `main` describing what changed and why.

## Agent contributors

AI agents should start at [`AGENTS.md`](AGENTS.md) and the skill manifest in
[`docs/skills/manifest.md`](docs/skills/manifest.md).

## Project direction and policies

- [`ROADMAP.md`](ROADMAP.md) — what the site is building toward and the current phase.
- [`GOVERNANCE.md`](GOVERNANCE.md) — how decisions get made and how pull requests land.
- [`SECURITY.md`](SECURITY.md) — how to report a vulnerability.
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — community participation expectations.

## Maintainers

See [`MAINTAINERS.md`](MAINTAINERS.md) for who reviews and merges changes here,
and the process for becoming a maintainer.
