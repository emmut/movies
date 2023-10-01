'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import Spinner from '../Spinner';

type AuthProps = {
  children: ReactNode;
};

export default function Auth({ children }: AuthProps) {
  const { status } = useSession();

  if (status === 'loading') {
    return <Spinner />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return children;
}
