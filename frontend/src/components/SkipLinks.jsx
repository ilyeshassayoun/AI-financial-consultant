import React from 'react';
import styles from '../styles/shared.module.css';

/**
 * Skip Links for Keyboard Navigation
 * Provides quick navigation to main content areas
 */
export function SkipLinks() {
  return (
    <nav className={styles.skipLinks} aria-label="Skip links">
      <ul role="list">
        <li>
          <a
            href="#main-content"
            className={styles.skipLink}
          >
            Skip to main content
          </a>
        </li>
        <li>
          <a
            href="#main-navigation"
            className={styles.skipLink}
          >
            Skip to navigation
          </a>
        </li>
        <li>
          <a
            href="#ai-assistant"
            className={styles.skipLink}
          >
            Skip to AI assistant
          </a>
        </li>
      </ul>
    </nav>
  );
}

export default SkipLinks;
