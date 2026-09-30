import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => {
  const host = process.env.MAIL_HOST;
  const port = parseInt(process.env.MAIL_PORT ?? '587', 10);
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASSWORD;
  const from = process.env.MAIL_FROM ?? 'Freelo <no-reply@freelo.dev>';

  if (!host || !user || !pass) {
    throw new Error('Mail environment variables are not fully configured');
  }
  return { host, port, user, pass, from };
});
