# Milestone plan for endusers.cncf.io

This document defines the GitHub milestones that back [ROADMAP.md](./ROADMAP.md)
(see PR #50) and the tracking issue #45. GitHub milestones cannot be created by
the automation that authored this plan (no API write access), so a maintainer
with write access should create them from this list, then tag the referenced
issues/PRs against the matching milestone.

Once created, this file can be deleted or trimmed to a short pointer — the
milestones themselves become the source of truth.

## Milestone: Phase 0 — Foundation

**Description**: A reliable, trustworthy site skeleton: green deploys, a
license, supply-chain hygiene, and this planning infrastructure.

Tag these issues/PRs:
- #44 (deploy blocker)
- #32, PR #40 (LICENSE)
- #38, #39, PRs #41–#43 (pin actions by SHA / verify installers)
- #36, PR #37 (shared validation utilities + test coverage)
- #45 (this roadmap/milestones issue), PR #50 (ROADMAP.md)

## Milestone: Phase 1 — Content completeness

**Description**: Every content pillar (architectures, metrics, awards,
community, events, blog) is accurate, current, and self-maintaining.

Tag issues covering:
- Architectures sync freshness indicator
- Metrics data refresh + validation gating
- Awards historical winner list verification
- Community/TAB membership and End User Group pathways
- Events listing for KubeCon + CloudNativeCon
- Blog publishing cadence

## Milestone: Phase 2 — Community and governance

**Description**: The project can outlive any single maintainer.

Tag these issues/PRs:
- #47 (MAINTAINERS.md / bus factor)
- Governance/agent-automation policy issue (if filed)
- Good-first-issue curation
- #46 (long-term ownership decision)

## Milestone: Phase 3 — Ecosystem integration

**Description**: endusers.cncf.io becomes the authoritative end-user
destination.

Tag issues/PRs covering:
- DNS cutover to endusers.cncf.io
- Cross-linking with contribute.cncf.io and cncf.io
- Content-issue templates and a public changelog

## How to apply this plan

1. Create the four milestones above via the repo's Issues → Milestones page,
   using the descriptions verbatim.
2. For each milestone, open the linked issues/PRs and set the milestone field.
3. Close or update this file once milestones exist and are populated.
