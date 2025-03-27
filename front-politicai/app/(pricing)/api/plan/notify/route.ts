import { auth } from '@/app/(auth)/auth';
import { getUser } from '@/lib/db/queries';
import { sendEmail } from '@/lib/functions/email-utils';
import { ResultPaymentApi } from '@/lib/functions/plan-subscribe';

function removeDomainFromEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return email;
  }
  return email.substring(0, atIndex);
}

function buildMessageByPaymentType(payment: ResultPaymentApi, name: string): string {
  const baseMessage = `
    Olá ${name},

    Obrigado por escolher nossos serviços. Para concluir sua assinatura, por favor, utilize as informações abaixo para realizar o pagamento:

  `;

  if (payment.pixCopiaECola) {
    return `
      ${baseMessage}
      Pix Copia e Cola: ${payment.pixCopiaECola}
      Chave Pix: ${payment.chave}

      Se você tiver alguma dúvida ou precisar de assistência, não hesite em nos contatar.

      Atenciosamente,
      Equipe Politicai
    `;
  }

  return `
    ${baseMessage}
    Link de Pagamento: ${payment.linkPayment}

    Se você tiver alguma dúvida ou precisar de assistência, não hesite em nos contatar.

    Atenciosamente,
    Equipe Politicai
  `;
}

export async function POST(request: Request) {
  const { paymentNotify }: { paymentNotify: ResultPaymentApi } = await request.json();
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!paymentNotify) {
    return new Response('Body required', { status: 400 });
  }

  const user = await getUser(session.user.email || '');

  if (!user) {
    return new Response('User not Found', { status: 400 });
  }

  const emailWithoutDomain = removeDomainFromEmail(user[0].email);

  await sendEmail({
    to: user[0].email,
    subject: 'Assinatura Pendente',
    message: buildMessageByPaymentType(paymentNotify, emailWithoutDomain),
  });

  return new Response('', {
    status: 202,
  });
}
