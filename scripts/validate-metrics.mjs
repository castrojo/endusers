#!/usr/bin/env node
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../data/metrics.json', import.meta.url)));
const errors = [];
if (!data.generated) errors.push('generated must be true');
if (Number.isNaN(Date.parse(data.generatedAt))) errors.push('generatedAt must be ISO 8601');
if (!data.sources?.landscape?.revision || !data.sources?.architectures?.revision) errors.push('source revisions are required');
const ids = new Set();
for (const metric of data.metrics || []) {
  if (!metric.id || ids.has(metric.id)) errors.push(`duplicate or missing metric id: ${metric.id}`);
  ids.add(metric.id);
  if (metric.value === undefined || metric.value === null || metric.value === '') errors.push(`missing value: ${metric.id}`);
  if (!metric.source || !metric.sourceUrl || !metric.collectedAt) errors.push(`missing provenance: ${metric.id}`);
}
for (const item of data.omitted || []) if (!item.id || !item.reason) errors.push('omitted metrics require id and reason');
for (const card of data.referenceArchitectureLifecycle?.cards || []) if (!card.id || !card.label || !Number.isFinite(card.value)) errors.push('invalid lifecycle card');
for (const item of data.referenceArchitectureLifecycle?.omitted || []) if (!item.id || !item.reason) errors.push('invalid lifecycle omission');
for (const series of Object.values(data.series || {})) {
  if (!series.label || !series.sourceUrl || !Array.isArray(series.values) || !series.values.length) errors.push('invalid time series');
  for (const point of series.values || []) if (!point.date || !Number.isFinite(point.value)) errors.push('invalid time-series point');
}
for (const chart of Object.values(data.breakdowns || {})) {
  if (!chart.label || !chart.sourceUrl || !Array.isArray(chart.values)) errors.push('invalid breakdown');
  for (const item of chart.values || []) if (!item.name || !Number.isFinite(item.value)) errors.push('invalid breakdown value');
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Validated ${data.metrics.length} metrics`);
