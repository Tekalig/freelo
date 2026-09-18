import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in env.');
  }

  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in env.');
  }

  return {
    secret,
    refreshSecret,
    audience: process.env.JWT_TOKEN_AUDIENCE,
    issuer: process.env.JWT_TOKEN_ISSUER,
    accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '3600', 10),
    refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '8640', 10),
  };
});
