import { Test, TestingModule } from '@nestjs/testing';
import { InvoicingController } from './invoicing.controller';
import { InvoicingService } from './invoice.service';

describe('InvoicingController', () => {
  let controller: InvoicingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicingController],
      providers: [InvoicingService],
    }).compile();

    controller = module.get<InvoicingController>(InvoicingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
