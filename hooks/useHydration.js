import { useState, useEffect } from 'react';

/**
 * Hook to track hydration state to prevent SSR/client mismatches
 * @returns {boolean} isHydrated - true once the component has hydrated on the client
 */
export default function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}