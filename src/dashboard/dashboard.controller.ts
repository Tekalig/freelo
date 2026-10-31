// dashboard/dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ActiveUser } from '../iam/decorators/active-user.decorator';

@ApiTags('dashboard')
@ApiCookieAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@ActiveUser('userId') userId: string) {
    return this.dashboardService.getStats(userId);
  }
}
