import { createSubscribePlan, getPlans } from '@/lib/db/queries';
import type { Plans } from '@/lib/db/schema';

const apiKey = process.env.API_FINANCE_KEY || 'none';
const clientId = process.env.API_FINANCE_CLIENT_ID || 'none';

export type ResultPaymentApi = {
  linkPayment?: string;
  chave?: string,
  pixCopiaECola?: string,
  qrCode?: string,
  id?: string
};

async function retrievePriceId(productId: string): Promise<string> {
  const response = await fetch(
    `https://caixinha-financeira-9a2031b303cc.herokuapp.com/stripe/products/${productId}`,
    {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to get price id');
  }

  const data = await response.json();
  return data.associatedPrice;
}

async function createOneLink(priceId: string, userId: string) {
  const response = await fetch(
    'https://caixinha-financeira-9a2031b303cc.herokuapp.com/stripe/payment-link',
    {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'client-id': clientId,
      },
      body: JSON.stringify({
        quantity: 1,
        priceId,
        externalReferenceId: userId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to create payment link');
  }

  const data = await response.json();
  return data;
}

async function createPixCob(userId: string, plan: Plans) {
  const price = Number(plan.price) / 100;
  const payload = {
    "chavePix": "cb1c2dad-c099-4f47-b03e-f8b1ae683260",
    "valor": price,
    "devedorNome": `user-${userId}`,
    "devedorCPF": "05833251907",
    "descricaoSolicitacao": plan.name,
    "externalReference": userId
  }

  const response = await fetch(
    'https://caixinha-financeira-9a2031b303cc.herokuapp.com/pix/criar-cobranca',
    {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'client-id': clientId,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to create pix link');
  }

  const {
    chave,
    pixCopiaECola,
    qrCode
  } = await response.json();

  return {
    chave,
    pixCopiaECola,
    qrCode
  }
}

async function subscribeUserToPlan(userId: string, plan: Plans, isPix: boolean): Promise<ResultPaymentApi> {
  const result = isPix 
    ? await createPixCob(userId, plan) 
    : await handleCardPayment(userId, plan);

  await createSubscribePlan(plan.id, userId);

  return result;
}

async function handleCardPayment(userId: string, plan: Plans): Promise<ResultPaymentApi> {
  const priceId = await retrievePriceId(plan.planRef);
  return await createOneLink(priceId, userId);
}

async function checkIfPlanExists(planId: string): Promise<Plans | undefined> {
  const plans = await getPlans();
  return plans.find((i) => i.id === planId);
}

export async function subscribeOnPlan(
  userId: string,
  planId: string,
  billingType: string,
): Promise<ResultPaymentApi> {
  if (!userId || !planId) {
    throw new Error('User ID and Plan ID are required');
  }

  const planExists = await checkIfPlanExists(planId);
  if (!planExists) {
    throw new Error('Plan does not exist');
  }

  const infoPayment = await subscribeUserToPlan(userId, planExists, billingType === 'Pix');
  return infoPayment;
}
