import React from 'react';
import catalog from '@site/data/architectures/catalog.json';
import styles from './styles.module.css';

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function ArchitectureCard({ architecture }) {
  const { organization, title, summary, industries, projects, id } = architecture;
  return (
    <a href={`/architectures/${id}`} className={styles.card}>
      <div className={styles.logoWrapper} aria-hidden="true">
        {architecture.assets?.find((asset) => /logo|wordmark/i.test(asset)) ? (
          <img
            src={architecture.assets.find((asset) => /logo|wordmark/i.test(asset))}
            alt=""
            className={styles.logo}
          />
        ) : (
          <span className={styles.initials}>{initials(organization)}</span>
        )}
      </div>
      <div className={styles.cardContent}>
        <p className={styles.eyebrow}>{industries.join(' · ') || 'Reference architecture'}</p>
        <h2 className={styles.orgName}>{organization}</h2>
        <p className={styles.title}>{title}</p>
        <p className={styles.summary}>{summary}</p>
        <div className={styles.projectsList}>
          {projects.slice(0, 4).map((project) => (
            <span key={project} className={styles.projectTag}>
              {project}
            </span>
          ))}
        </div>
        <span className={styles.link}>View architecture →</span>
      </div>
    </a>
  );
}

export default function ReferenceArchitectures() {
  return (
    <section aria-label="Reference architecture catalog">
      <p className={styles.catalogMeta}>
        {catalog.length} real-world architecture reports from CNCF end users.
      </p>
      <div className={styles.grid}>
        {catalog.map((architecture) => (
          <ArchitectureCard key={architecture.id} architecture={architecture} />
        ))}
      </div>
    </section>
  );
}
