import { getUserById } from '@/lib/db/queries';
import { completeSubscriptionForUser } from '@/lib/functions/complete-subscription';

export async function POST(request: Request) {
  const { clientID, externalRef } = await request.json();

  if (clientID !== process.env.API_FINANCE_CLIENT_ID)
    return new Response('Unauthorized', { status: 401 });

  const user = await getUserById(externalRef);

  if (!user) return new Response('ExternalRef not found', { status: 404 });

  await completeSubscriptionForUser(user.id);
  return new Response();
}
