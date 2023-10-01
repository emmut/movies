import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

export default function UserDetails() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Image
          src={session?.user?.image ?? ''}
          alt="User profile picture"
          className="h-7 w-7 overflow-hidden rounded-full"
          width={28}
          height={28}
        />
        <p className="text-sm">{session?.user?.name}</p>
      </div>

      <Link href="/settings" className="text-sm text-neutral-500">
        Settings
      </Link>

      <button
        className="mt-3 rounded-md border border-neutral-50 px-4 py-1.5 text-sm"
        onClick={() => signOut()}
      >
        Sign out
      </button>
    </div>
  );
}
