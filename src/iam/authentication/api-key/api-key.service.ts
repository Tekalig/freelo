import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { HashingService } from 'src/iam/hashing/hashing.service';
import { ApiKey } from './entities/api-key.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey) private readonly apiKeyRepo: Repository<ApiKey>,
    private readonly hashService: HashingService,
  ) {}

  async create(userId: string, name: string, expiresAt?: Date) {
    const rawKey = `freelo-${randomBytes(40).toString('hex')}`;
    const hashedKey = this.hashService.hashToken(rawKey);
    const keyPerfix = rawKey.slice(0, 12);

    const apiKey = this.apiKeyRepo.create({
      user: { id: userId },
      name,
      hashedKey,
      keyPerfix,
      expiresAt,
    });

    await this.apiKeyRepo.save(apiKey);

    return { rawKey, id: apiKey.id, name: name, keyPerfix };
  }

  async validateKey(rawKey: string) {
    const hashedKey = this.hashService.hashToken(rawKey);

    const apiKey = await this.apiKeyRepo.findOne({
      where: { hashedKey, isActive: true },
      relations: { user: true },
    });

    if (!apiKey) throw new UnauthorizedException('Invalid API Key.');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API Key expired.');
    }

    apiKey.lastUsedAt = new Date();
    await this.apiKeyRepo.save(apiKey);

    return apiKey.user;
  }

  findAllForUser(userId: string) {
    return this.apiKeyRepo.find({
      where: { user: { id: userId }, isActive: true },
    });
  }

  async revoke(userId: string, id: string) {
    const apiKey = await this.apiKeyRepo.findOne({
      where: { user: { id: userId }, id },
    });

    if (!apiKey) throw new UnauthorizedException('Invalid API Key.');

    apiKey.isActive = false;

    return this.apiKeyRepo.save(apiKey);
  }
}
