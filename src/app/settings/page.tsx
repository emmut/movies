import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { z } from 'zod';

const regionSchema = z.string().max(32);

async function formAction(data: FormData) {
  'use server';

  const session = await getServerSession(authOptions);

  if (session?.user?.email == null) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (user === null) {
    return;
  }

  const region = regionSchema.parse(data.get('region'));

  await prisma.userSettings.upsert({
    create: {
      userId: user.id,
      name: 'region',
      value: region,
    },
    update: {
      value: region,
    },
    where: {
      userId: user.id,
      name: 'region',
    },
  });
}

export default async function Settings() {
  const session = await getServerSession(authOptions);

  if (session === null) {
    redirect('/');
  }

  return (
    <form className="grid grid-cols-1 gap-2" action={formAction}>
      <label htmlFor="region">Select a region</label>
      <input type="text" name="region" id="region" className="text-black" />
      <button type="submit">Save</button>
    </form>
  );
}
