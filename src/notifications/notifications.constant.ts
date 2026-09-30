export const NOTIFICATIONS_QUEUE = 'notifications';

export interface InvoiceNotificationJob {
  type: 'invoice_sent' | 'invoice_paid' | 'invoice_overdue';
  invoiceId: string;
}
