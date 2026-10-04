'use client';

import dynamic from 'next/dynamic';

import { QuickAddButtonInner, type QuickAddButtonProps } from './quick-add-button-inner';

// Client-only: the session it reads never exists during SSR, so the subtree
// is neither server-rendered nor hydrated — no mismatch, and the menu code
// stays out of the initial bundle for signed-out visitors.
const SessionQuickAddButton = dynamic(() => import('./session-quick-add-button'), { ssr: false });

export function QuickAddButton({ userId, ...props }: QuickAddButtonProps) {
  if (userId) {
    return <QuickAddButtonInner {...props} />;
  }

  return <SessionQuickAddButton {...props} />;
}
