import { Test, TestingModule } from '@nestjs/testing';
import { InvoicePdfService } from './invoice-pdf.service';

describe('InvoicePdfService', () => {
  let service: InvoicePdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoicePdfService],
    }).compile();

    service = module.get<InvoicePdfService>(InvoicePdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
