import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingService {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract hashToken(data: string): string;
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  abstract compareHashes(encryptA: string, encryptB: string): boolean;
}
