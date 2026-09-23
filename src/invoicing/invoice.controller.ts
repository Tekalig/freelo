import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { ApiTags } from '@nestjs/swagger';
import { CheckPolicies } from 'src/iam/authorization/decorators/policies.decorator';
import { Action } from 'src/iam/authorization/action.enum';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { InvoicePdfService } from './invoice-pdf.service';
import type { Response } from 'express';

@ApiTags('Invoice')
@Controller('invoices')
@CheckPolicies((ability) => ability.can(Action.Manage, 'Invoice'))
export class InvoicingController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  @Post('generate')
  create(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Body() dto: GenerateInvoiceDto,
  ) {
    return this.invoiceService.generateFromProject(userId, dto);
  }

  @Get()
  findAll(@ActiveUser('userId', ParseUUIDPipe) userId: string) {
    return this.invoiceService.findAllForUser(userId);
  }

  @Get(':id')
  findOne(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id') id: string,
  ) {
    return this.invoiceService.findOne(userId, id);
  }

  @Post(':id/send')
  markAsSent(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id') id: string,
  ) {
    return this.invoiceService.markAsSent(userId, id);
  }

  @Post(':id/payment-link')
  createPaymentLink(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id') id: string,
  ) {
    return this.invoiceService.createPaymentLink(userId, id);
  }

  @Get(':id/pdf')
  async remove(
    @ActiveUser('userId', ParseUUIDPipe) userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoiceService.findOne(userId, id);
    const pdfBuffer = await this.invoicePdfService.generate(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Description': `attachment; filename=${invoice.invoiceNumber}.pdf`,
    });
    res.send(pdfBuffer);
  }
}
