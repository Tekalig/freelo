import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { ClientsService } from 'src/clients/clients.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly clientService: ClientsService,
  ) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    try {
      const client = await this.clientService.findOne(
        userId,
        createProjectDto.clientId,
      );

      const project = this.projectRepo.create({
        user: { id: userId },
        client: { id: client.id },
        ...createProjectDto,
      });

      return await this.projectRepo.save(project);
    } catch (error) {
      console.log(error.code);
      if (error.code === '23505') {
        throw new ConflictException(
          'A Project with this name already exist for this client.',
        );
      }
      throw error;
    }
  }

  async findAllByUser(userId: string) {
    return await this.projectRepo.find({
      where: { user: { id: userId } },
      relations: { client: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.projectRepo.findOne({
      where: { id: id, user: { id: userId } },
      relations: { client: true },
    });

    if (!project) throw new NotFoundException('Project is Not Found!!');

    return project;
  }

  async update(userId: string, id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(userId, id);
    Object.assign(project, updateProjectDto);

    return this.projectRepo.save(project);
  }

  async remove(userId: string, id: string) {
    const project = await this.findOne(userId, id);

    return this.projectRepo.remove(project);
  }
}
