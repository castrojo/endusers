# Roadmap: endusers.cncf.io

This roadmap describes the planned evolution of the CNCF End User Community site.
It is a living document; update it as priorities change. Tracking issue: #45.

## Vision

Be the trusted home of the CNCF End User Community: the place where organizations
running cloud native in production find reference architectures, metrics, events,
and pathways to participate.

## Launch target

**KubeCon + CloudNativeCon North America 2026 (Nov 9–12, Salt Lake City)** is
the target announcement window (see issue #104): the largest concentration of
CNCF end users this year, and every Phase 1 content pillar is exactly what
that audience looks for. The week-by-week backwards plan lives in
`LAUNCH.md` (PR #108); the ownership decision that must land before the
announcement is tracked in ADR 0001 / issue #99.

## Guiding principles

- **Audience first**: content serves end users (adopters), not project contributors.
- **Data over prose**: metrics, awards, and architectures are generated from
  authoritative sources (cncf/landscape, cncf/architecture, cncf/tab), never hand-edited.
- **Verified facts**: every CNCF fact is backed by an authoritative source link.
- **Green pipeline**: the site must always deploy; a broken deploy blocks everything.

## Phase 0 — Foundation (current)

Goal: a reliable, trustworthy site skeleton.

- [ ] Restore a green deploy pipeline (blocked: see issue #44)
- [x] Add a LICENSE (PR #40, issue #32)
- [ ] Pin GitHub Actions by SHA and verify downloaded installers (issues #38, #39; PRs #41–#43)
- [ ] Shared validation utilities and test coverage for data pipelines (issue #36, PR #37)
- [ ] This roadmap, plus GitHub milestones matching these phases (issue #45)

## Phase 1 — Content completeness

Goal: every pillar section is accurate, current, and self-maintaining.

- [ ] Architectures: automated import from cncf/architecture stays in sync (scheduled workflow exists; add freshness indicator on the page)
- [ ] Metrics: scheduled refresh of data/metrics.json with validation gating the build
- [ ] Awards: complete historical winner list, each entry verified against its cncf.io announcement
- [ ] Community: current TAB membership, End User Groups, and engagement pathways
- [ ] Events: upcoming end-user events at KubeCon + CloudNativeCon
- [ ] Blog: establish a publishing cadence beyond the welcome post

## Phase 2 — Community and governance

Goal: the project can outlive any single maintainer.

- [ ] MAINTAINERS.md with an explicit process for adding maintainers (issue #47)
- [ ] Governance note describing review/merge expectations, including agent-automation policy
- [ ] Good-first-issue curation to recruit human contributors
- [ ] Decide the long-term home of the site (issue #46): transfer to a CNCF org,
      remain a personal staging site, or merge into an existing CNCF property

## Phase 3 — Ecosystem integration

Goal: endusers.cncf.io becomes the authoritative end-user destination.

- [ ] DNS cutover to endusers.cncf.io (depends on Phase 2 ownership decision)
- [ ] Cross-linking with contribute.cncf.io and cncf.io (clear audience boundaries)
- [ ] Public feedback loop: content-issue templates and a visible changelog

## Non-goals

- Contributor-facing documentation (belongs on contribute.cncf.io)
- Project-facing marketing for individual CNCF projects
- Client-specific or proprietary framing of any kind

## How this roadmap is maintained

- Strategic gaps and reprioritizations are filed as GitHub issues by the strategist
  agent and reviewed by the maintainer.
- Each phase maps to a GitHub milestone; issues and PRs are tagged accordingly.
- This document is updated by planning PRs, not ad hoc edits.
