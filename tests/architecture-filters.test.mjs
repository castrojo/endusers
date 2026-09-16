import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import ArchitectureFilters, {
  filterArchitectures,
  useArchitectureFilterOptions,
} from '../src/components/ArchitectureFilters/index.js';

const architecture = (overrides = {}) => ({
  organization: 'Acme Corp',
  title: 'Edge ingest pipeline',
  summary: 'Streaming ingest at the edge.',
  industries: ['Retail'],
  projects: ['Kubernetes'],
  ...overrides,
});

const noFilters = {
  query: '',
  industry: '',
  project: '',
  organization: '',
};

const fixtures = [
  architecture(),
  architecture({
    organization: 'Globex',
    title: 'Batch analytics platform',
    summary: 'Nightly warehouse jobs.',
    industries: ['Finance', 'Retail'],
    projects: ['Argo', 'Kubernetes'],
  }),
  architecture({
    organization: 'Initech',
    title: 'Service mesh rollout',
    summary: 'Progressive delivery for internal APIs.',
    industries: ['Telecom'],
    projects: ['Istio'],
  }),
];

const orgsOf = (results) => results.map((a) => a.organization);

describe('filterArchitectures', () => {
  test('returns every architecture when no filter is set', () => {
    assert.deepEqual(orgsOf(filterArchitectures(fixtures, noFilters)), [
      'Acme Corp',
      'Globex',
      'Initech',
    ]);
  });

  test('matches the query against organization, title and summary', () => {
    assert.deepEqual(
      orgsOf(filterArchitectures(fixtures, { ...noFilters, query: 'globex' })),
      ['Globex'],
    );
    assert.deepEqual(
      orgsOf(filterArchitectures(fixtures, { ...noFilters, query: 'mesh' })),
      ['Initech'],
    );
    assert.deepEqual(
      orgsOf(filterArchitectures(fixtures, { ...noFilters, query: 'nightly' })),
      ['Globex'],
    );
  });

  test('ignores query case and surrounding whitespace', () => {
    assert.deepEqual(
      orgsOf(
        filterArchitectures(fixtures, { ...noFilters, query: '   INITECH  ' }),
      ),
      ['Initech'],
    );
  });

  // A query of only whitespace normalizes to empty and must not filter anything
  // out, which is the branch that decides whether the search term applies.
  test('treats a whitespace-only query as no query', () => {
    assert.equal(
      filterArchitectures(fixtures, { ...noFilters, query: '   ' }).length,
      3,
    );
  });

  test('returns nothing when the query matches no architecture', () => {
    assert.deepEqual(
      filterArchitectures(fixtures, { ...noFilters, query: 'mainframe' }),
      [],
    );
  });

  test('filters by industry across multi-industry entries', () => {
    assert.deepEqual(
      orgsOf(
        filterArchitectures(fixtures, { ...noFilters, industry: 'Retail' }),
      ),
      ['Acme Corp', 'Globex'],
    );
    assert.deepEqual(
      orgsOf(
        filterArchitectures(fixtures, { ...noFilters, industry: 'Telecom' }),
      ),
      ['Initech'],
    );
  });

  test('filters by project across multi-project entries', () => {
    assert.deepEqual(
      orgsOf(
        filterArchitectures(fixtures, { ...noFilters, project: 'Kubernetes' }),
      ),
      ['Acme Corp', 'Globex'],
    );
  });

  test('filters by organization on an exact match', () => {
    assert.deepEqual(
      orgsOf(
        filterArchitectures(fixtures, {
          ...noFilters,
          organization: 'Globex',
        }),
      ),
      ['Globex'],
    );
    assert.deepEqual(
      filterArchitectures(fixtures, { ...noFilters, organization: 'Glob' }),
      [],
    );
  });

  test('applies every active filter conjunctively', () => {
    assert.deepEqual(
      orgsOf(
        filterArchitectures(fixtures, {
          query: 'analytics',
          industry: 'Retail',
          project: 'Argo',
          organization: 'Globex',
        }),
      ),
      ['Globex'],
    );
  });

  test('returns nothing when active filters conflict', () => {
    assert.deepEqual(
      filterArchitectures(fixtures, {
        ...noFilters,
        industry: 'Telecom',
        project: 'Argo',
      }),
      [],
    );
  });

  test('does not mutate or reorder the input collection', () => {
    const input = [...fixtures];
    filterArchitectures(input, { ...noFilters, query: 'globex' });
    assert.deepEqual(orgsOf(input), ['Acme Corp', 'Globex', 'Initech']);
  });

  test('handles an empty collection', () => {
    assert.deepEqual(filterArchitectures([], { ...noFilters, query: 'x' }), []);
  });
});

describe('useArchitectureFilterOptions', () => {
  // The hook is exercised through a probe component because hooks may only run
  // inside a render; renderToStaticMarkup gives us that without a DOM.
  const collectOptions = (architectures) => {
    let captured;
    const Probe = () => {
      captured = useArchitectureFilterOptions(architectures);
      return null;
    };
    renderToStaticMarkup(React.createElement(Probe));
    return captured;
  };

  test('returns de-duplicated, sorted option lists', () => {
    assert.deepEqual(collectOptions(fixtures), {
      industries: ['Finance', 'Retail', 'Telecom'],
      projects: ['Argo', 'Istio', 'Kubernetes'],
      organizations: ['Acme Corp', 'Globex', 'Initech'],
    });
  });

  test('returns empty lists for an empty collection', () => {
    assert.deepEqual(collectOptions([]), {
      industries: [],
      projects: [],
      organizations: [],
    });
  });
});

describe('ArchitectureFilters rendering', () => {
  const options = {
    industries: ['Finance', 'Retail'],
    projects: ['Argo', 'Kubernetes'],
    organizations: ['Acme Corp', 'Globex'],
  };

  const render = (props = {}) =>
    renderToStaticMarkup(
      React.createElement(ArchitectureFilters, {
        options,
        filters: noFilters,
        setQuery: () => {},
        setIndustry: () => {},
        setProject: () => {},
        setOrganization: () => {},
        activeCount: 0,
        onClear: () => {},
        resultCount: 2,
        totalCount: 3,
        ...props,
      }),
    );

  test('labels every control for assistive technology', () => {
    const markup = render();
    for (const id of [
      'architecture-search',
      'architecture-organization',
      'architecture-industry',
      'architecture-project',
    ]) {
      assert.match(markup, new RegExp(`for="${id}"`));
      assert.match(markup, new RegExp(`id="${id}"`));
    }
  });

  test('announces the result count politely', () => {
    const markup = render();
    assert.match(markup, /aria-live="polite"/);
    assert.match(markup, /<strong>2<\/strong> of 3 architectures/);
  });

  test('offers an "All" choice plus one option per value', () => {
    const markup = render();
    for (const value of [
      ...options.industries,
      ...options.projects,
      ...options.organizations,
    ]) {
      assert.match(markup, new RegExp(`value="${value}"`));
    }
    assert.match(markup, /All organizations/);
    assert.match(markup, /All industries/);
    assert.match(markup, /All projects/);
  });

  test('hides the clear button until a filter is active', () => {
    assert.doesNotMatch(render({ activeCount: 0 }), /Clear filters/);
    assert.match(render({ activeCount: 2 }), /Clear filters/);
  });

  test('reflects the current filter values in the controls', () => {
    const markup = render({
      filters: {
        query: 'mesh',
        industry: 'Retail',
        project: 'Argo',
        organization: 'Globex',
      },
    });
    assert.match(markup, /value="mesh"/);
    for (const value of ['Globex', 'Retail', 'Argo']) {
      assert.match(markup, new RegExp(`<option value="${value}" selected=""`));
    }
    assert.doesNotMatch(markup, /<option value="Kubernetes" selected=""/);
  });
});
