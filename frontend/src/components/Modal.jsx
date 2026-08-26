import React, { useId, useRef, Fragment } from 'react';
import { X } from 'lucide-react';
import { FocusTrap } from './FocusTrap';
import styles from '../styles/shared.module.css';

/**
 * Accessible Modal Dialog
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {string} props.title - Modal title (required for accessibility)
 * @param {string} props.description - Optional description for the modal
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.size - Modal size: 'sm', 'md', 'lg', 'xl', 'full'
 * @param {boolean} props.showCloseButton - Show close button
 * @param {boolean} props.closeOnOverlayClick - Close when clicking overlay
 * @param {boolean} props.closeOnEscape - Close on Escape key
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) {
  const modalRef = useRef(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  const handleEscape = () => {
    if (closeOnEscape) onClose();
  };

  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  return (
    <Fragment>
      <div
        className={`${styles.modalBackdrop} fixed inset-0 z-[1000]`}
        role="presentation"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      <FocusTrap
        isActive={true}
        containerRef={modalRef}
        onEscape={handleEscape}
      />
      <div
        ref={modalRef}
        className={`${styles.modal} fixed inset-0 z-[1100] flex items-center justify-center p-4`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        <div
          className={`${sizeClasses[size]} w-full ${styles.modalContent} ${styles.cardElevated} ${styles.animateScaleIn}`}
          style={{ maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {(title || showCloseButton) && (
            <header className={`${styles.modalHeader} flex items-start justify-between p-6 border-b border-[var(--color-border-default)] flex-shrink-0`}>
              <div>
                <h2
                  id={titleId}
                  className={`${styles.modalTitle} text-xl font-extrabold text-[var(--color-text-primary)]`}
                >
                  {title}
                </h2>
                {description && (
                  <p
                    id={descId}
                    className={`${styles.modalDescription} mt-1 text-sm text-[var(--color-text-secondary)]`}
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  className={`${styles.btnIcon} ${styles.focusRing}`}
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X size={20} color="var(--color-text-secondary)" strokeWidth={2} />
                </button>
              )}
            </header>
          )}
          <div
            className={`${styles.modalBody} flex-1 overflow-y-auto p-6`}
            tabIndex={0}
          >
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Modal;