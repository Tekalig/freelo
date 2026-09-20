import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ApiTags } from '@nestjs/swagger';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { CheckPolicies } from 'src/iam/authorization/decorators/policies.decorator';
import { Action } from 'src/iam/authorization/action.enum';

@ApiTags('clients')
@Controller('clients')
@CheckPolicies((ability) => ability.can(Action.Manage, 'Client'))
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Client'))
  create(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(userId, createClientDto);
  }

  @Get()
  findAll(@ActiveUser('userId', ParseUUIDPipe) userId: string) {
    return this.clientsService.findAllForUser(userId);
  }

  @Get(':id')
  findOne(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clientsService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(userId, id, updateClientDto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  remove(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clientsService.remove(userId, id);
  }
}
