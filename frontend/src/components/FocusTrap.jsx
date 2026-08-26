import { useEffect, useRef } from 'react';

/**
 * FocusTrap - Traps focus within a container for modal dialogs
 * @param {Object} props
 * @param {boolean} props.isActive - Whether the trap is active
 * @param {React.RefObject<HTMLElement>} props.containerRef - Ref to the container element
 * @param {Function} props.onEscape - Callback when Escape key is pressed
 * @param {boolean} props.disableAutoFocus - Disable auto-focus on first focusable element
 */
export function FocusTrap({ isActive, containerRef, onEscape, disableAutoFocus = false }) {
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement;

    const container = containerRef.current;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element unless disabled
    if (!disableAutoFocus && firstElement) {
      firstElement.focus();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape?.();
        return;
      }

      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous element
      if (previousActiveElement.current && document.body.contains(previousActiveElement.current)) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, containerRef, onEscape, disableAutoFocus]);

  return null;
}

export default FocusTrap;