import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import storageConfig from '../config/storage.config';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly s3: S3Client;

  constructor(
    @Inject(storageConfig.KEY)
    private readonly storageConfiguration: ConfigType<typeof storageConfig>,
  ) {
    this.s3 = new S3Client({
      endpoint: this.storageConfiguration.endpoint,
      region: this.storageConfiguration.region,
      credentials: {
        accessKeyId: this.storageConfiguration.accessKeyId,
        secretAccessKey: this.storageConfiguration.secretAccessKey,
      },
      forcePathStyle: true, // required for MinIO — it doesn't support virtual-hosted-style URLs
    });
  }

  async onModuleInit() {
    try {
      await this.s3.send(
        new HeadBucketCommand({ Bucket: this.storageConfiguration.bucket }),
      );
    } catch {
      await this.s3.send(
        new CreateBucketCommand({ Bucket: this.storageConfiguration.bucket }),
      );
    }
  }

  async upload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ fileKey: string }> {
    const fileKey = `${userId}/${randomUUID()}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.storageConfiguration.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { fileKey };
  }

  async getDownloadUrl(fileKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.storageConfiguration.bucket,
      Key: fileKey,
    });
    return getSignedUrl(this.s3, command, { expiresIn: 300 }); // 5-minute signed URL
  }

  async delete(fileKey: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.storageConfiguration.bucket,
        Key: fileKey,
      }),
    );
  }
}
