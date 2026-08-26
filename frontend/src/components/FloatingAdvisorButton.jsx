import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import styles from './FloatingAdvisorButton.module.css';

export default function FloatingAdvisorButton({ onClick, isOpen = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Ilyes AI Wealth Concierge"
      aria-expanded={isOpen}
      title="Open Ilyes AI Wealth Concierge"
      className={styles.floatingButton}
    >
      <div className={styles.iconWrapper}>
        <Bot size={16} color="var(--maison-gold)" strokeWidth={2} />
        <span className={styles.liveDot} />
      </div>
      <span className={styles.label}>AI Concierge</span>
      <Sparkles size={12} color="var(--maison-gold)" className={styles.sparkleIcon} />
    </button>
  );
}