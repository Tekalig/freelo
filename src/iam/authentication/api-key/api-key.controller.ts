import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { CreateApiKeyDto } from './dto/api-key.dto';
import { CheckPolicies } from 'src/iam/authorization/decorators/policies.decorator';
import { Action } from 'src/iam/authorization/action.enum';

@Controller('api-key')
@CheckPolicies((ability) => ability.can(Action.Manage, 'ApiKey'))
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  create(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeyService.create(userId, dto.name, dto.expiresAt);
  }

  @Get()
  findAll(@ActiveUser('userId') userId: string) {
    return this.apiKeyService.findAllForUser(userId);
  }

  @Delete(':id')
  revoke(@ActiveUser('userId') userId: string, @Param('id') id: string) {
    return this.apiKeyService.revoke(userId, id);
  }
}
