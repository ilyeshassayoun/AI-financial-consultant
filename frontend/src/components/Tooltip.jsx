import React, { useState, useRef, useEffect, useId } from 'react';
import styles from '../styles/shared.module.css';

/**
 * Accessible Tooltip
 * @param {Object} props
 * @param {React.ReactNode} props.children - Trigger element (must accept ref)
 * @param {string} props.content - Tooltip content
 * @param {string} props.position - Tooltip position: 'top', 'bottom', 'left', 'right'
 * @param {number} props.delay - Show/hide delay in ms
 * @param {boolean} props.disabled - Disable tooltip
 */
export function Tooltip({ children, content, position = 'top', delay = 200, disabled = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);
  const childRef = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      // Position tooltip
      const tooltip = tooltipRef.current;
      const trigger = childRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const gap = 8;

      let top, left;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - gap;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + gap;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - gap;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + gap;
          break;
      }

      // Keep within viewport
      const viewportPadding = 8;
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding));

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    }
  }, [isVisible, position]);

  const show = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      hide();
      childRef.current?.focus();
    }
  };

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', hide, { passive: true });
      window.addEventListener('resize', hide);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', hide);
      window.removeEventListener('resize', hide);
    };
  }, [isVisible]);

  return (
    <>
      <span
        ref={childRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={isVisible ? tooltipId : undefined}
        style={{ display: 'inline-flex' }}
      >
        {children}
      </span>
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`${styles.tooltip} fixed z-[1300] px-3 py-2 text-xs font-medium text-white bg-[var(--color-forest-800)] rounded-sm shadow-xl pointer-events-none animateFadeIn`}
          style={{
            maxWidth: '280px',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          {content}
        </div>
      )}
    </>
  );
}

export default Tooltip;