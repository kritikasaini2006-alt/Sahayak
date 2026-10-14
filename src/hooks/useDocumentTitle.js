import { useEffect } from 'react';

/**
 * Custom hook to dynamically update document title on route changes.
 * @param {string} title - Page specific title.
 * @param {boolean} [retainOnUnmount=false] - Whether to keep title on unmount.
 */
export default function useDocumentTitle(title, retainOnUnmount = false) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | Sahayak AI`;
    }

    return () => {
      if (!retainOnUnmount) {
        document.title = prevTitle;
      }
    };
  }, [title, retainOnUnmount]);
}

