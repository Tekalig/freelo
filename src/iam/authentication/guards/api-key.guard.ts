import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../api-key/api-key.service';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const apikey = request.headers['x-api-key'] as string | undefined;

    if (!apikey) throw new UnauthorizedException('Missing API key');

    const user = await this.apiKeyService.validateKey(apikey);

    request.user = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      authMethod: 'api-key',
    };

    return true;
  }
}
