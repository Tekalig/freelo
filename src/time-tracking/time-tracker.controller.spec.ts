import { Test, TestingModule } from '@nestjs/testing';
import { TimeTrackingController } from './time-tracker.controller';
import { TimeTrackingService } from './time-tracker.service';

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
