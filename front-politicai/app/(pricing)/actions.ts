import { ResultPaymentApi } from "@/lib/functions/plan-subscribe";

async function notify(paymentNotify: ResultPaymentApi) {
  await fetch('api/plan/notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentNotify }),
  });
}

export async function fetchPlans(callback: Function) {
  const response = await fetch('api/plan');
  const data = await response.json();
  callback(data);
}

export async function subcribeAction(planId: string, billingType: 'Pix' | 'Cartao de credito') {
  const response = await fetch('api/plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ planId, billingType }),
  });

  const resultPayment: ResultPaymentApi = await response.json();

  await notify(resultPayment);

  return resultPayment;
}
