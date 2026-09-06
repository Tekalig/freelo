import { registerAs } from '@nestjs/config';

export default registerAs('googleAuth', () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE CLIENT ID is not defined in env.');
  }

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error('GOOGLE CLIENT SECRET is not defined in env.');
  }

  return { clientId, clientSecret };
});
