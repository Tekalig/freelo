import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { ProjectsService } from 'src/projects/projects.service';
import stripeConfig from 'src/config/stripe.config';
import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import { TimeTrackingService } from 'src/time-tracking/time-tracker.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import { InvoiceStatus } from './enums/invoice-status.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class InvoiceService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly projectService: ProjectsService,
    private readonly notificationsService: NotificationsService,
    private readonly timeTrackerService: TimeTrackingService,
    private readonly datasource: DataSource,
    @Inject(stripeConfig.KEY)
    private readonly stripeConfiguration: ConfigType<typeof stripeConfig>,
  ) {
    this.stripe = new Stripe(this.stripeConfiguration.secretKey);
  }

  async generateFromProject(userId: string, dto: GenerateInvoiceDto) {
    const project = await this.projectService.findOne(userId, dto.projectId);
    const unbilledEntries =
      await this.timeTrackerService.findUnbilledForProject(userId, project.id);

    if (unbilledEntries.length === 0) {
      throw new BadRequestException(
        'No unbilled time entries fro this project.',
      );
    }

    if (!project.hourlyRate) {
      throw new BadRequestException(
        'Project has no hourly rate set - cannot auto-generate line items',
      );
    }

    const hourlyRateCents = Math.round(parseFloat(project.hourlyRate) * 100);

    return this.datasource.transaction(async (manager) => {
      let subtotal = 0;
      const lineItems: InvoiceLineItem[] = [];

      for (const entry of unbilledEntries) {
        const hours = (entry.durationMinutes ?? 0) / 60;
        const amount = Math.round(hours * hourlyRateCents);
        subtotal += amount;

        const lineItem = manager.create(InvoiceLineItem, {
          description:
            entry.description ||
            `Time entry - ${entry.startedAt.toISOString().slice(0, 10)}`,
          quantity: hours.toFixed(2),
          unitPrice: hourlyRateCents,
          amount,
          timeEntry: { id: entry.id },
        });

        lineItems.push(lineItem);
      }
      const dueDate =
        dto.dueDate ??
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

      const invoice = manager.create(Invoice, {
        user: { id: userId },
        client: { id: project.client.id },
        invoiceNumber: await this.generateInvoiceNumber(userId, manager),
        status: InvoiceStatus.Draft,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate,
        subtotal,
        tax: 0,
        total: subtotal,
        currency: project.currency,
        lineItems,
      });

      const savedInvoice = await manager.save(invoice);

      await manager.update(
        'time_entry',
        unbilledEntries.map((e) => e.id),
        { isInvoiced: true },
      );

      return savedInvoice;
    });
  }

  private async generateInvoiceNumber(
    userId: string,
    manager: any,
  ): Promise<string> {
    const count = await manager.count(Invoice, {
      where: { user: { id: userId } },
    });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padEnd(4, '0')}`;
  }

  findAllForUser(userId: string) {
    return this.invoiceRepo.find({
      where: { user: { id: userId } },
      relations: { client: true, lineItems: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, user: { id: userId } },
      relations: { client: true, lineItems: true },
    });
    if (!invoice) throw new NotFoundException('Invoice Not Found!');
    return invoice;
  }

  findOneRaw(id: string) {
    return this.invoiceRepo.findOne({
      where: { id },
      relations: { client: true, lineItems: true, user: true },
    });
  }

  async markAsSent(userId: string, id: string) {
    const invoice = await this.findOne(userId, id);
    invoice.status = InvoiceStatus.Sent;

    const saved = await this.invoiceRepo.save(invoice);
    await this.notificationsService.queueInvoiceSent(saved.id);
    return saved;
  }

  async createPaymentLink(userId: string, invoiceId: string) {
    const invoice = await this.findOne(userId, invoiceId);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: { name: `Invoice ${invoice.invoiceNumber}` },
            unit_amount: invoice.total,
          },
          quantity: 1,
        },
      ],
      metadata: { invoiceId: invoice.id },
      success_url: `${process.env.FRONTEND_URL}/invoices/${invoice.id}?paid=true`,
      cancel_url: `${process.env.FRONTEND_URL}/invoices/${invoice.id}`,
    });

    invoice.stripePaymentLinkUrl = session.url;
    await this.invoiceRepo.save(invoice);

    return { checkoutUrl: session.url };
  }

  verifyWebhookSignature(payload: Buffer, signature: string) {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.stripeConfiguration.webhookSecret,
    );
  }

  async handlePaymentSucceeded(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;

    const invoiceId = session.metadata?.invoiceId;
    if (!invoiceId) return;

    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) return;

    invoice.status = InvoiceStatus.Paid;
    await this.invoiceRepo.save(invoice);

    const paymant = this.paymentRepo.create({
      invoice: { id: invoice.id },
      stripePaymentIntentId: session.payment_intent as string,
      amount: invoice.total,
      currency: invoice.currency,
      status: PaymentStatus.Succeeded,
      paidAt: new Date(),
    });

    await this.paymentRepo.save(paymant);
    await this.notificationsService.queueInvoicePaid(invoice.id);
  }
}
