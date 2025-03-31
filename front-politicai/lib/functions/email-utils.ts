type EmailInputType = {
  to: string;
  subject: string;
  message: string;
  chavePix?: string;
  pixCopiaECola?: string;
  linkPagamento?: string;
};

export async function sendEmail(emailInput: EmailInputType): Promise<void> {
  const response = await fetch(
    'https://communication-service-4f4f57e0a956.herokuapp.com/email',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailInput.to,
        subject: emailInput.subject,
        message: emailInput.message,
        templateCode: 2,
        customBodyProps: {
          chavePix: emailInput.chavePix,
          pixCopiaECola: emailInput.pixCopiaECola,
          linkPagamento: emailInput.linkPagamento,
        }
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to create payment link');
  }

  const responseData = await response.json();
  console.log('email sending response', responseData);
}
