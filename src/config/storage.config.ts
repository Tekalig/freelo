import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => {
  const endpoint = process.env.MINIO_ENDPOINT ?? 'http://localhost:9000';
  const accessKeyId = process.env.MINIO_ROOT_USER ?? 'freelo-access';
  const secretAccessKey =
    process.env.MINIO_ROOT_PASSWORD ?? 'freelo-secret-key';
  const bucket = process.env.MINIO_BUCKET ?? 'freelo-files';

  return {
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    region: 'us-east-1',
  };
});
