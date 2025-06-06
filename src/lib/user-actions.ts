'use server';

import { user } from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import {
  DEFAULT_REGION,
  isValidRegionCode,
  RegionCode,
  regionSchema,
} from '@/lib/regions';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getUserRegion() {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userData = await db
    .select({ region: user.region })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (userData.length === 0) {
    throw new Error('User not found');
  }

  return (userData[0].region || DEFAULT_REGION) as RegionCode;
}

export async function updateUserRegion(region: string) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedRegion = regionSchema.parse(region);

  if (!isValidRegionCode(validatedRegion)) {
    throw new Error('Invalid region code');
  }

  await db
    .update(user)
    .set({
      region: validatedRegion,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  revalidatePath('/settings');
  revalidatePath('/discover');
  revalidatePath('/');

  return { success: true, region: validatedRegion };
}
