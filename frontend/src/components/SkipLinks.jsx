import React from 'react';
import styles from '../styles/shared.module.css';

/**
 * Skip Links for Keyboard Navigation
 * Provides quick navigation to main content areas
 */
export function SkipLinks() {
  return (
    <nav className={`${styles.skipLinks} sr-only focus-within:not-sr-only fixed top-0 left-0 z-[1300] p-2`} aria-label="Skip links">
      <ul className="flex flex-col gap-2" role="list">
        <li>
          <a
            href="#main-content"
            className={`${styles.skipLink} inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-primary)] text-white font-semibold rounded-md shadow-lg focus:ring-4 focus:ring-[var(--color-gold-300)]`}
          >
            Skip to main content
          </a>
        </li>
        <li>
          <a
            href="#main-navigation"
            className={`${styles.skipLink} inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-primary)] text-white font-semibold rounded-md shadow-lg focus:ring-4 focus:ring-[var(--color-gold-300)]`}
          >
            Skip to navigation
          </a>
        </li>
        <li>
          <a
            href="#ai-assistant"
            className={`${styles.skipLink} inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-primary)] text-white font-semibold rounded-md shadow-lg focus:ring-4 focus:ring-[var(--color-gold-300)]`}
          >
            Skip to AI assistant
          </a>
        </li>
      </ul>
    </nav>
  );
}

export default SkipLinks;