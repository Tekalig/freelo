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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApiTags } from '@nestjs/swagger';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { CheckPolicies } from 'src/iam/authorization/decorators/policies.decorator';
import { Action } from 'src/iam/authorization/action.enum';

@ApiTags('Projects')
@Controller('projects')
@CheckPolicies((ability) => ability.can(Action.Manage, 'Project'))
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Project'))
  create(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, createProjectDto);
  }

  @Get()
  findAll(@ActiveUser('userId', ParseUUIDPipe) userId: string) {
    return this.projectsService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id') id: string,
  ) {
    return this.projectsService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(userId, id, updateProjectDto);
  }

  @Delete(':id')
  remove(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id') id: string,
  ) {
    return this.projectsService.remove(userId, id);
  }
}
