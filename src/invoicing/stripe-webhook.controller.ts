import { Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Auth } from 'src/iam/authentication/decorators/auth.decorator';
import { AuthType } from 'src/iam/authentication/enums/auth-type.enum';
import type { Request, Response } from 'express';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Auth(AuthType.None)
  @Post()
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    let event;
    try {
      event = this.invoiceService.verifyWebhookSignature(req.body, signature);
    } catch (error) {
      return res
        .status(400)
        .send(`Webhook signature verification failed: ${error.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      await this.invoiceService.handlePaymentSucceeded(event);
    }

    res.status(200).json({ received: true });
  }
}
