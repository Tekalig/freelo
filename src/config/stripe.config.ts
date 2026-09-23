import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) throw new Error('STRIPE SECRET is not defined.');

  if (!webhookSecret) throw new Error('WEBHOOK SECRET is not defined.');

  return { secretKey, webhookSecret };
});
