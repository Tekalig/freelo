export enum NotificationType {
  InvoiceSent = 'invoice_sent',
  InvoicePaid = 'invoice_paid',
  InvoiceOverdue = 'invoice_overdue',
}

export enum NotificationStatus {
  Queued = 'queued',
  Sent = 'sent',
  Failed = 'failed',
}
