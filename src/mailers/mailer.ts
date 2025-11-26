import { config } from '../config/app.config';
import { resend } from './resendClient';

type Params = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  from?: string;
};

const mailer_sender =
  config.NODE_ENV === 'development'
    ? `no-reply <onboarding@evairo.fixio.blog>`
    : `no-reply <${config.MAILER_SENDER}>`;

export const sendEmail = async ({
  to,
  from = mailer_sender,
  subject,
  text,
  html,
}: Params) => {
  return await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    text,
    subject,
    html,
  });
};
// redeploy
