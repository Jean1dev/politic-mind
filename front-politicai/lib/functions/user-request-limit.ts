import { getLastInteraction, saveUserLimit } from '@/lib/db/queries';

async function registerUsage(
  userId: string,
  interactions: number,
  limit: number,
) {
  await saveUserLimit(userId, interactions + 1, limit);
}

export async function verifyUserRequestLimit(userId: string): Promise<boolean> {
  if (!userId) return false;

  const {
    iterations = 0,
    limit = 10,
    createdAt = new Date(),
  } = (await getLastInteraction(userId)) || {};

  if (iterations >= limit) {
    if (new Date(createdAt).toDateString() === new Date().toDateString()) {
      return false;
    }

    await registerUsage(userId, 0, limit);
  } else {
    await registerUsage(userId, iterations, limit);
  }
  return true;
}
