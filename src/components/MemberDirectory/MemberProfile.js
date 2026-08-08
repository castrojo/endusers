import React, { useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
import { initials, formatCount } from './utils';

export function MemberProfile({ member, onClose, triggerRef }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const logoUrl = useBaseUrl(member.logo || '');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('button, a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      (triggerRef.current || previousFocus)?.focus?.();
    };
  }, [onClose, triggerRef]);

  const hasDetails =
    member.industries.length > 0 ||
    member.projects.length > 0 ||
    member.architectures.length > 0 ||
    member.awards.length > 0;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-profile-name"
      >
        <button
          ref={closeRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={`Close ${member.name} profile`}
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className={styles.profileHero}>
          <div className={styles.logoStage} aria-hidden="true">
            {member.logo ? (
              <img src={logoUrl} alt="" className={styles.profileLogo} />
            ) : (
              <span className={styles.initialsLarge}>
                {initials(member.name)}
              </span>
            )}
          </div>
          <div className={styles.profileHeading}>
            <p className={styles.profileKicker}>End User Community member</p>
            <h2 id="member-profile-name">{member.name}</h2>
            <p className={styles.profileMeta}>
              {member.architectures.length > 0 && (
                <span>
                  {formatCount(
                    member.architectures.length,
                    'architecture',
                    'architectures',
                  )}
                </span>
              )}
              {member.awards.length > 0 && (
                <span>
                  {formatCount(member.awards.length, 'award', 'awards')}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className={styles.profileBody}>
          {member.industries.length > 0 && (
            <div className={styles.profileSection}>
              <h3>Industries</h3>
              <ul className={styles.tagList}>
                {member.industries.map((industry) => (
                  <li key={industry} className={styles.tag}>
                    {industry}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {member.projects.length > 0 && (
            <div className={styles.profileSection}>
              <h3>CNCF projects</h3>
              <ul className={styles.tagList}>
                {member.projects.map((project) => (
                  <li key={project} className={styles.tag}>
                    {project}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {member.architectures.length > 0 && (
            <div className={styles.profileSection}>
              <h3>Reference architectures</h3>
              <ul className={styles.linkList}>
                {member.architectures.map((architecture) => (
                  <li key={architecture.id}>
                    <Link to={`/architectures/${architecture.id}`}>
                      {architecture.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {member.awards.length > 0 && (
            <div className={styles.profileSection}>
              <h3>Awards</h3>
              <ul className={styles.awardList}>
                {member.awards.map((award, index) => (
                  <li
                    key={`${award.year}-${index}`}
                    className={styles.awardItem}
                  >
                    <p className={styles.awardLabel}>
                      {award.year} · {award.awardLabel}
                    </p>
                    <p className={styles.awardCitation}>{award.citation}</p>
                    <p className={styles.awardEvent}>{award.event}</p>
                    <div className={styles.awardLinks}>
                      {award.announcementUrl && (
                        <a
                          href={award.announcementUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Announcement<span aria-hidden="true">↗</span>
                        </a>
                      )}
                      {award.caseStudyUrl && (
                        <a
                          href={award.caseStudyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Case study<span aria-hidden="true">↗</span>
                        </a>
                      )}
                      {award.talkUrl && (
                        <a
                          href={award.talkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Watch the talk<span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!hasDetails && (
            <p className={styles.bioMuted}>
              Public details for {member.name} are limited to award
              announcements. Visit the source links below to learn more.
            </p>
          )}
          <div className={styles.profileSection}>
            <h3>Sources</h3>
            <ul className={styles.linkList}>
              {member.sourceAttribution.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url.replace(/^https:\/\//, '').replace(/\/$/, '')}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
