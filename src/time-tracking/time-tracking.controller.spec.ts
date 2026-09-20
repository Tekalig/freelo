import { Test, TestingModule } from '@nestjs/testing';
import { TimeTrackingController } from './time-tracking.controller';
import { TimeTrackingService } from './time-tracking.service';

describe('TimeTrackingController', () => {
  let controller: TimeTrackingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeTrackingController],
      providers: [TimeTrackingService],
    }).compile();

    controller = module.get<TimeTrackingController>(TimeTrackingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
