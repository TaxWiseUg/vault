import { useEffect } from 'react';

/**
 * Custom hook to lock body scrolling when a modal / overlay is open
 * and cleanly restore it upon closing or unmounting.
 */
export function useLockBodyScroll(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    let originalOverflow = '';
    let originalPaddingRight = '';

    const timer = setTimeout(() => {
      try {
        originalOverflow = document.body.style.overflow;
        originalPaddingRight = document.body.style.paddingRight;

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
      } catch (err) {
        console.warn('Could not lock body scroll:', err);
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      try {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      } catch (err) {
        // Safe cleanup
      }
    };
  }, [isLocked]);
}
