'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';

type GuestProps = {
  children: ReactNode;
};

export default function Guest({ children }: GuestProps) {
  const { status } = useSession();

  if (status === 'unauthenticated') {
    return children;
  }

  return null;
}
