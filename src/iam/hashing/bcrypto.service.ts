import { Injectable } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { compare, genSalt, hash } from 'bcrypt';
import { createHash, timingSafeEqual } from 'crypto';

@Injectable()
export class BcryptService implements HashingService {
  hashToken(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  compareHashes(encryptA: string, encryptB: string): boolean {
    const bufA = Buffer.from(encryptA, 'hex');
    const bufB = Buffer.from(encryptB, 'hex');

    if (bufA.length !== bufB.length) return false;

    return timingSafeEqual(bufA, bufB);
  }

  async hash(data: string | Buffer): Promise<string> {
    const salt = await genSalt();
    return hash(data, salt);
  }

  async compare(data: string | Buffer, encrypted: string): Promise<boolean> {
    return compare(data, encrypted);
  }
}
