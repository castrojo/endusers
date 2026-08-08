# Milestone plan for endusers.cncf.io

This document defines the GitHub milestones that back [ROADMAP.md](./ROADMAP.md)
(see PR #50) and the tracking issue #45. GitHub milestones cannot be created by
the automation that authored this plan (no API write access), so a maintainer
with write access should create them, then tag the referenced issues/PRs
against the matching milestone.

## Applying this plan

The plan below is also encoded in [`data/milestones.json`](./data/milestones.json).
A maintainer can execute it in one step by running the
[**Create milestones**](../../actions/workflows/create-milestones.yml)
workflow (Actions tab -> Create milestones -> Run workflow). It creates the
four milestones (or reuses them if they already exist) and tags each listed
issue/PR, using the workflow's own `GITHUB_TOKEN`, which — unlike the hive
automation's token — has milestone write access. Re-running it is safe; it
will not duplicate milestones or overwrite existing issue milestones unless
`retag` is set to true.

Alternatively, create the four milestones by hand from the descriptions
below via the repo's Issues -> Milestones page, then tag issues manually.

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

1. Run the [Create milestones](../../actions/workflows/create-milestones.yml)
   workflow (or create the four milestones manually via the repo's
   Issues → Milestones page, using the descriptions verbatim).
2. Confirm each milestone shows the expected linked issues/PRs.
3. Close or update this file once milestones exist and are populated.
