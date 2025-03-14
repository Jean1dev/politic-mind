import { auth } from '@/app/(auth)/auth';
import { getUser } from '@/lib/db/queries';
import { sendEmail } from '@/lib/functions/email-utils';

function removeDomainFromEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return email;
  }
  return email.substring(0, atIndex);
}

export async function POST(request: Request) {
  const { paymentLink } = await request.json();
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!paymentLink) {
    return new Response('Payment link is required', { status: 400 });
  }

  const user = await getUser(session.user.email || '');

  if (!user) {
    return new Response('User not Found', { status: 400 });
  }

  const emailWithoutDomain = removeDomainFromEmail(user[0].email);

  await sendEmail({
    to: user[0].email,
    subject: 'Assinatura Pendente',
    message: `
            Olá ${emailWithoutDomain},

            Obrigado por escolher nossos serviços. Para concluir sua assinatura, por favor, clique no link abaixo para realizar o pagamento:

            ${paymentLink}

            Se você tiver alguma dúvida ou precisar de assistência, não hesite em nos contatar.

            Atenciosamente,
            Equipe Politicai
        `,
  });

  return new Response('', {
    status: 202,
  });
}
