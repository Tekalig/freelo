import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
  ) {}

  create(userId: string, createClientDto: CreateClientDto) {
    const client = this.clientRepo.create({
      ...createClientDto,
      user: { id: userId },
    });
    return this.clientRepo.save(client);
  }

  findAllForUser(userId: string) {
    return this.clientRepo.find({ where: { user: { id: userId } } });
  }

  async findOne(userId: string, id: string) {
    const client = await this.clientRepo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!client) {
      throw new NotFoundException();
    }
    return client;
  }

  async update(userId: string, id: string, updateClientDto: UpdateClientDto) {
    const client = await this.clientRepo.preload({
      id,
      user: { id: userId },
      ...updateClientDto,
    });

    if (!client) {
      throw new NotFoundException();
    }
    return client;
  }

  async remove(userId: string, id: string) {
    const client = await this.findOne(userId, id);
    return this.clientRepo.remove(client);
  }
}
