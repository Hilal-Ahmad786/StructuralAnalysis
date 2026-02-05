/**
 * ShareHitTracker - Client component for tracking share link access
 * 
 * Fires a POST request on mount to increment access count.
 * Non-blocking and fails silently.
 */

'use client';

import { useEffect, useRef } from 'react';

interface ShareHitTrackerProps {
  token: string;
}

export function ShareHitTracker({ token }: ShareHitTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per mount
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Fire-and-forget - don't block UI
    fetch(`/api/share/${token}/hit`, { method: 'POST' })
      .catch(() => {
        // Silently fail - hit tracking is non-critical
      });
  }, [token]);

  // This component renders nothing
  return null;
}
