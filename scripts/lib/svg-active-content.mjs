/**
 * Detection and removal of active (script-executing) content in SVG assets.
 *
 * Architecture diagrams are imported verbatim from a separate upstream
 * repository and published under static/. Browsers execute scripts inside an
 * SVG when it is requested as a top-level document, so an SVG carrying a
 * <script> element, an inline event handler, or a javascript: URI is a
 * same-origin script-execution vector on the published site. Both the importer
 * and the asset validator use these helpers so the import pipeline strips such
 * content and the validator fails the build if any survives.
 */

const RULES = [
  {
    id: 'script-element',
    describe: () => 'contains a <script> element',
    pattern: /<script\b[\s\S]*?<\/script\s*>/gi,
    replacement: '',
  },
  {
    id: 'script-element-selfclosing',
    describe: () => 'contains a self-closing <script> element',
    pattern: /<script\b[^>]*\/>/gi,
    replacement: '',
  },
  {
    id: 'event-handler',
    describe: (match) => `contains inline event handler ${match[1]}`,
    pattern: /\s(on[a-z]+)\s*=\s*(?:"[^"]*"|'[^']*')/gi,
    replacement: '',
  },
  {
    id: 'script-uri',
    describe: (match) => `contains a ${match[2]} URI in ${match[1]}`,
    pattern:
      /\s(href|xlink:href|src|from|to|values)\s*=\s*(?:"\s*(javascript|data:text\/html|vbscript)[^"]*"|'\s*(javascript|data:text\/html|vbscript)[^']*')/gi,
    replacement: '',
  },
];

/**
 * Finds active content in an SVG source string.
 *
 * @param {string} source - Raw SVG markup.
 * @returns {string[]} Human-readable descriptions, one per distinct issue.
 */
export function findSvgActiveContent(source) {
  const findings = [];
  for (const rule of RULES) {
    for (const match of source.matchAll(rule.pattern)) {
      const normalized = match.slice();
      // script-uri captures the scheme in either the double- or single-quoted
      // alternative; normalize it into position 2 for the describe callback.
      if (rule.id === 'script-uri') normalized[2] = match[2] ?? match[3];
      const message = rule.describe(normalized);
      if (!findings.includes(message)) findings.push(message);
    }
  }
  return findings;
}

/**
 * Removes active content from an SVG source string.
 *
 * @param {string} source - Raw SVG markup.
 * @returns {string} Markup with script elements, inline event handlers, and
 *   script URIs removed.
 */
export function stripSvgActiveContent(source) {
  let result = source;
  for (const rule of RULES) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}
