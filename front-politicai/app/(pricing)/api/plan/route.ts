import { auth } from '@/app/(auth)/auth';
import { getPlans } from '@/lib/db/queries';
import type { Plans } from '@/lib/db/schema';
import { subscribeOnPlan } from '@/lib/functions/plan-subscribe';

function remapResponse(plans: Plans[]) {
  return JSON.stringify(
    plans
      .filter((i) => i.active)
      .map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price / 100,
        featured: i.planRef === 'prod_RwC7v0U239A49T',
        fullWidth: false,
      })),
  );
}

export async function GET() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const plans = await getPlans();

  return new Response(remapResponse(plans), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(request: Request) {
  const { planId, billingType } = await request.json();
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const result = await subscribeOnPlan(session.user.id, planId, billingType);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
