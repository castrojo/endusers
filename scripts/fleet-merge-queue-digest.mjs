#!/usr/bin/env node
// Builds a weekly cross-repo merge-queue digest for the hive fleet (issue #81).
//
// The hive App can only see one repo's PR queue at a time, so mergeable PRs
// pile up per-repo with no fleet-wide view for the human merge gate to
// triage by value. This script queries each fleet repo's open PRs (public
// data, read-only) and produces a markdown digest: per-repo open/mergeable/
// conflicting counts, oldest-PR age, days-since-last-push, and a
// security-first ordering of open PRs across the fleet.
//
// Usage: node scripts/fleet-merge-queue-digest.mjs
// Requires: `gh` CLI authenticated with read access to the repos below
// (all public). Prints the digest markdown to stdout.

import { execFileSync } from 'node:child_process';

const FLEET_REPOS = [
  'castrojo/endusers',
  'castrojo/peoplehub',
  'castrojo/bootc-ecosystem',
  'castrojo/firehose',
  'castrojo/cncf-darkmode',
];

// Ordered from highest to lowest triage priority, per GOVERNANCE.md
// (security > bugfix > feature > deps > other).
const CLASS_ORDER = ['security', 'bugfix', 'feature', 'deps', 'other'];

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' });
}

function classify(title) {
  const t = title.toLowerCase();
  if (/\bsec(urity)?\b|\bcve-|vulnerab|checksum|sha-?256/.test(t))
    return 'security';
  if (/^fix|bugfix|\bfix:|\bfix\(/.test(t)) return 'bugfix';
  if (/^feat|\bfeat:|\bfeat\(/.test(t)) return 'feature';
  if (/depend|\bbump\b|\bdeps?\b/.test(t)) return 'deps';
  return 'other';
}

function daysSince(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function fetchRepoQueue(repo) {
  const repoInfo = JSON.parse(
    gh(['api', `repos/${repo}`, '--jq', '{pushed_at: .pushed_at}']),
  );
  const prsRaw = gh([
    'pr',
    'list',
    '--repo',
    repo,
    '--state',
    'open',
    '--limit',
    '200',
    '--json',
    'number,title,createdAt,mergeable,isDraft,url',
  ]);
  const prs = JSON.parse(prsRaw);

  const open = prs.filter((pr) => !pr.isDraft);
  const mergeable = open.filter((pr) => pr.mergeable === 'MERGEABLE');
  const conflicting = open.filter((pr) => pr.mergeable === 'CONFLICTING');
  const oldest = open.reduce(
    (acc, pr) => (!acc || pr.createdAt < acc.createdAt ? pr : acc),
    null,
  );

  return {
    repo,
    pushedAt: repoInfo.pushed_at,
    daysSincePush: daysSince(repoInfo.pushed_at),
    open,
    mergeable,
    conflicting,
    oldestAgeDays: oldest ? daysSince(oldest.createdAt) : null,
    prs: open.map((pr) => ({ ...pr, repo, class: classify(pr.title) })),
  };
}

function buildDigest(queues) {
  const lines = [];
  lines.push('## Fleet-wide merge-queue digest');
  lines.push('');
  lines.push(
    `Cross-repo view for the ${queues.length} repos in the hive fleet (issue #81) — ` +
      "no need to open each repo's PR tab separately.",
  );
  lines.push('');
  lines.push(
    '| Repo | Open | Mergeable | Conflicting | Oldest PR | Days since last push |',
  );
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const q of queues.sort(
    (a, b) => b.mergeable.length - a.mergeable.length,
  )) {
    const stale = q.daysSincePush >= 30 ? ` (stale)` : '';
    lines.push(
      `| ${q.repo} | ${q.open.length} | ${q.mergeable.length} | ${q.conflicting.length} | ` +
        `${q.oldestAgeDays === null ? '-' : `${q.oldestAgeDays}d`} | ${q.daysSincePush}d${stale} |`,
    );
  }

  const totalOpen = queues.reduce((n, q) => n + q.open.length, 0);
  const totalMergeable = queues.reduce((n, q) => n + q.mergeable.length, 0);
  const totalConflicting = queues.reduce((n, q) => n + q.conflicting.length, 0);
  lines.push('');
  lines.push(
    `**Fleet totals**: ${totalOpen} open, ${totalMergeable} mergeable, ${totalConflicting} conflicting.`,
  );

  const dormant = queues.filter(
    (q) => q.daysSincePush >= 30 && q.mergeable.length > 0,
  );
  if (dormant.length > 0) {
    lines.push('');
    lines.push(
      '**Dormant repos with mergeable PRs queued** (default branch has not moved in 30+ days):',
    );
    for (const q of dormant) {
      lines.push(
        `- ${q.repo}: ${q.mergeable.length} mergeable, last push ${q.daysSincePush}d ago`,
      );
    }
  }

  lines.push('');
  lines.push('### Mergeable PRs, security-first');
  const allMergeable = queues.flatMap((q) =>
    q.prs.filter((pr) => pr.mergeable === 'MERGEABLE'),
  );
  for (const cls of CLASS_ORDER) {
    const inClass = allMergeable
      .filter((pr) => pr.class === cls)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (inClass.length === 0) continue;
    lines.push('');
    lines.push(`**${cls}** (${inClass.length})`);
    for (const pr of inClass) {
      lines.push(
        `- [${pr.repo}#${pr.number}](${pr.url}) ${pr.title} (${daysSince(pr.createdAt)}d old)`,
      );
    }
  }

  return lines.join('\n');
}

async function main() {
  const queues = FLEET_REPOS.map(fetchRepoQueue);
  const digest = buildDigest(queues);
  process.stdout.write(digest + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
