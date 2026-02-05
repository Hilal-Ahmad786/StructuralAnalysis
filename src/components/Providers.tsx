/**
 * Providers - Client-side context providers wrapper
 */

'use client';

import React from 'react';
import { ToastProvider } from '@/components/common';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
