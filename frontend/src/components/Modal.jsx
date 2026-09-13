import { useId, useRef, Fragment } from 'react';
import { X } from 'lucide-react';
import { FocusTrap } from './FocusTrap';

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

  const sizeMaxWidth = {
    sm: '480px',
    md: '576px',
    lg: '768px',
    xl: '960px',
    full: '90vw',
  };

  return (
    <Fragment>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(6, 11, 20, 0.72)',
          backdropFilter: 'blur(8px)',
        }}
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
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        <div
          style={{
            maxWidth: sizeMaxWidth[size] || '576px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-architectural)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          {(title || showCloseButton) && (
            <header
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '24px',
                borderBottom: '1px solid var(--border-architectural)',
                flexShrink: 0,
              }}
            >
              <div>
                <h2
                  id={titleId}
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
                {description && (
                  <p
                    id={descId}
                    style={{
                      marginTop: '4px',
                      marginBottom: 0,
                      fontSize: '0.86rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-architectural)',
                    background: 'var(--bg-card-subtle)',
                    cursor: 'pointer',
                  }}
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X size={20} color="var(--text-secondary)" strokeWidth={2} />
                </button>
              )}
            </header>
          )}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
            }}
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