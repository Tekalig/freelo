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
import { TimeTrackingService } from './time-tracker.service';
import { StartTimerDto } from './dto/start-timer.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto';
import { CheckPolicies } from 'src/iam/authorization/decorators/policies.decorator';
import { Action } from 'src/iam/authorization/action.enum';

@ApiTags('Time Tracker')
@Controller('time-entries')
@CheckPolicies((ability) => ability.can(Action.Manage, 'TimeEntry'))
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post('timer/start')
  startTimer(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Body() startTimerDto: StartTimerDto,
  ) {
    return this.timeTrackingService.startTimer(userId, startTimerDto);
  }

  @Post('timer/stop')
  stopTimer(@ActiveUser('userId', ParseUUIDPipe) userId: string) {
    return this.timeTrackingService.stopTimer(userId);
  }

  @Post()
  create(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateManualEntryDto,
  ) {
    return this.timeTrackingService.createManualEntry(userId, dto);
  }

  @Get()
  findAll(@ActiveUser('userId', ParseUUIDPipe) userId: string) {
    return this.timeTrackingService.findAllForUser(userId);
  }

  @Get(':id')
  findOne(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.timeTrackingService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTimeEntryDto: UpdateTimeEntryDto,
  ) {
    return this.timeTrackingService.update(userId, id, updateTimeEntryDto);
  }

  @Delete(':id')
  remove(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.timeTrackingService.remove(userId, id);
  }
}
