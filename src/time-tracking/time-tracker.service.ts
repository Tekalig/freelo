import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StartTimerDto } from './dto/start-timer.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { IsNull, Repository } from 'typeorm';
import { ProjectsService } from 'src/projects/projects.service';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto';

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeTrakerRepo: Repository<TimeEntry>,
    private readonly projectService: ProjectsService,
  ) {}

  async startTimer(userId: string, startTimerDto: StartTimerDto) {
    const project = await this.projectService.findOne(
      userId,
      startTimerDto.projectId,
    );

    const runningEntry = await this.timeTrakerRepo.find({
      where: {
        user: { id: userId },
        endedAt: IsNull(),
      },
    });

    if (runningEntry) {
      throw new BadRequestException(
        'A timer is already running. Stop it before starting a new one.',
      );
    }

    const entry = this.timeTrakerRepo.create({
      user: { id: userId },
      project: { id: project.id },
      startedAt: new Date(),
      endedAt: null,
      description: startTimerDto.description,
      isBillable: startTimerDto.isBillable ?? true,
    });

    return this.timeTrakerRepo.save(entry);
  }

  async stopTimer(userId: string) {
    const runningEntry = await this.timeTrakerRepo.findOne({
      where: { user: { id: userId }, endedAt: IsNull() },
    });

    if (!runningEntry) {
      throw new BadRequestException('No timer is currently running.');
    }

    const endedAt = new Date();
    const durationMinutes = Math.round(
      (endedAt.getTime() - runningEntry.startedAt.getTime()) / 60000,
    );

    runningEntry.endedAt = endedAt;
    runningEntry.durationMinutes = durationMinutes;

    return this.timeTrakerRepo.save(runningEntry);
  }

  async createManualEntry(userId: string, dto: CreateManualEntryDto) {
    const project = await this.projectService.findOne(userId, dto.projectId);

    const startedAt = new Date(dto.startedAt);
    const endedAt = new Date(dto.endedAt);

    if (endedAt <= startedAt) {
      throw new BadRequestException('Incorrect time entry');
    }

    const durationMinutes = Math.round(
      (endedAt.getTime() - startedAt.getTime()) / 60000,
    );

    const entry = this.timeTrakerRepo.create({
      user: { id: userId },
      project: { id: project.id },
      endedAt,
      startedAt,
      durationMinutes,
      description: dto.description,
      isBillable: dto.isBillable ?? true,
    });

    return this.timeTrakerRepo.save(entry);
  }

  findAllForUser(userId: string, projectId?: string) {
    return this.timeTrakerRepo.find({
      where: projectId
        ? { user: { id: userId }, project: { id: projectId } }
        : { user: { id: userId } },
      relations: { project: true },
      order: { startedAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string) {
    const entry = await this.timeTrakerRepo.findOne({
      where: { user: { id: userId }, id },
      relations: { project: true },
    });

    if (!entry) throw new NotFoundException('Time entry Not Found.');
    return entry;
  }

  async update(
    userId: string,
    id: string,
    updateTimeEntryDto: UpdateTimeEntryDto,
  ) {
    const entry = await this.findOne(userId, id);

    if (entry.isInvoiced) {
      throw new ForbiddenException(
        'Cannot edit a time entry that has already been invoiced',
      );
    }

    Object.assign(entry, updateTimeEntryDto);
    return this.timeTrakerRepo.save(entry);
  }

  async remove(userId: string, id: string) {
    const entry = await this.findOne(userId, id);

    if (entry.isInvoiced) {
      throw new ForbiddenException(
        'Cannot delete a time entry that has already been invoiced',
      );
    }

    return this.timeTrakerRepo.remove(entry);
  }

  findUnbilledForProject(userId: string, projectId: string) {
    return this.timeTrakerRepo
      .createQueryBuilder('entry')
      .where('entry.user.id = :userId', { userId })
      .andWhere('entry.project.id = :projectId', { projectId })
      .andWhere('entry.isBillable = true')
      .andWhere('entry.isInvoiced = false')
      .andWhere('entry.endedAt IS NOT NULL')
      .getMany();
  }
}
