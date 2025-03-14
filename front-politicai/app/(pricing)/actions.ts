async function notify(paymentLink: string) {
  await fetch('api/plan/notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentLink }),
  });
}

export async function fetchPlans(callback: Function) {
  const response = await fetch('api/plan');
  const data = await response.json();
  callback(data);
}

export async function subcribeAction(planId: string) {
  const response = await fetch('api/plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ planId }),
  });

  const { url, id } = await response.json();

  await notify(url);

  return url;
}
