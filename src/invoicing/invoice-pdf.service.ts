// invoicing/invoice-pdf.service.ts
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { Invoice } from './entities/invoice.entity';
import businessProfileConfig from 'src/config/business-profile.config';

const COLORS = {
  primary: '#1f2937',
  accent: '#2563eb',
  muted: '#6b7280',
  border: '#d1d5db',
};

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 545; // usable right edge on A4 with 50pt margins
const TABLE_BOTTOM_LIMIT = 680; // trigger a new page if the table would run past here

@Injectable()
export class InvoicePdfService {
  constructor(
    @Inject(businessProfileConfig.KEY)
    private readonly business: ConfigType<typeof businessProfileConfig>,
  ) {}

  generate(invoice: Invoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      this.renderHeader(doc, invoice);
      this.renderBillToAndPayment(doc, invoice);
      this.renderLineItemsTable(doc, invoice);
      this.renderSummary(doc, invoice);
      this.renderFooter(doc);

      doc.end();
    });
  }

  private formatMoney(cents: number, currency: string): string {
    const symbol = currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${(cents / 100).toFixed(2)}`;
  }

  private formatDate(value: string | Date | undefined | null): string {
    if (!value) return 'N/A';
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  }

  private renderHeader(doc: PDFKit.PDFDocument, invoice: Invoice) {
    doc
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .fontSize(26)
      .text('INVOICE');

    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted);
    doc.text(this.business.name);
    if (this.business.address) doc.text(this.business.address);
    const contactLine = [this.business.email, this.business.phone]
      .filter(Boolean)
      .join(' | ');
    if (contactLine) doc.text(contactLine);

    const metaX = 390;
    const metaY = 60;
    doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12);
    doc.text(`Invoice #${invoice.invoiceNumber}`, metaX, metaY);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted);
    doc.text(
      `Issue date: ${this.formatDate(invoice.issueDate)}`,
      metaX,
      metaY + 18,
    );
    doc.text(
      `Due date: ${this.formatDate(invoice.dueDate)}`,
      metaX,
      metaY + 32,
    );
    doc.text(`Status: ${invoice.status.toUpperCase()}`, metaX, metaY + 46);

    doc.y = Math.max(doc.y, metaY + 60);
    this.drawDivider(doc);
  }

  private renderBillToAndPayment(doc: PDFKit.PDFDocument, invoice: Invoice) {
    const top = doc.y;

    doc
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Bill To', 50, top);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted);
    doc.text(invoice.client.name, 50, top + 20);
    if (invoice.client.companyName)
      doc.text(invoice.client.companyName, 50, doc.y);
    if (invoice.client.billingAddress)
      doc.text(invoice.client.billingAddress, 50, doc.y);
    if (invoice.client.email) doc.text(invoice.client.email, 50, doc.y);

    if (this.business.bankName) {
      doc
        .fillColor(COLORS.primary)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Payment Details', 390, top);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted);
      doc.text(`Bank: ${this.business.bankName}`, 390, top + 20);
      if (this.business.bankAccount)
        doc.text(`Account: ${this.business.bankAccount}`, 390, doc.y);
      if (this.business.bankRouting)
        doc.text(`Routing: ${this.business.bankRouting}`, 390, doc.y);
    }

    doc.y = Math.max(doc.y, top + 100);
  }

  private renderLineItemsTable(doc: PDFKit.PDFDocument, invoice: Invoice) {
    const columns = [
      { x: 50, width: 240, label: 'Description', align: 'left' as const },
      { x: 300, width: 50, label: 'Qty', align: 'left' as const },
      { x: 360, width: 80, label: 'Rate', align: 'left' as const },
      { x: 455, width: 90, label: 'Amount', align: 'right' as const },
    ];

    const drawTableHeader = () => {
      const top = doc.y;
      doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(10);
      for (const col of columns) {
        doc.text(col.label, col.x, top, { width: col.width, align: col.align });
      }
      doc
        .strokeColor(COLORS.border)
        .moveTo(50, top + 16)
        .lineTo(PAGE_WIDTH, top + 16)
        .stroke();
      doc.y = top + 22;
    };

    drawTableHeader();

    doc.font('Helvetica').fillColor(COLORS.primary).fontSize(10);
    for (const item of invoice.lineItems) {
      if (doc.y > TABLE_BOTTOM_LIMIT) {
        doc.addPage();
        doc.y = PAGE_MARGIN;
        drawTableHeader();
        doc.font('Helvetica').fillColor(COLORS.primary).fontSize(10);
      }

      const rowY = doc.y;
      doc.text(item.description, 50, rowY, { width: 240, lineGap: 2 });
      doc.text(String(item.quantity), 300, rowY, { width: 50 });
      doc.text(this.formatMoney(item.unitPrice, invoice.currency), 360, rowY, {
        width: 80,
      });
      doc.text(this.formatMoney(item.amount, invoice.currency), 455, rowY, {
        width: 90,
        align: 'right',
      });
      doc.y = Math.max(doc.y, rowY + 20);
    }

    doc
      .strokeColor(COLORS.border)
      .moveTo(50, doc.y)
      .lineTo(PAGE_WIDTH, doc.y)
      .stroke();
    doc.moveDown(1);
  }

  private renderSummary(doc: PDFKit.PDFDocument, invoice: Invoice) {
    const labelX = 360;
    const valueX = 455;
    const valueWidth = 90;

    const row = (label: string, value: string, bold = false) => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 11 : 10)
        .fillColor(COLORS.primary);
      const y = doc.y;
      doc.text(label, labelX, y, { width: 90 });
      doc.text(value, valueX, y, { width: valueWidth, align: 'right' });
      doc.moveDown(bold ? 1 : 1.2);
    };

    row('Subtotal', this.formatMoney(invoice.subtotal, invoice.currency));
    row('Tax', this.formatMoney(invoice.tax, invoice.currency));
    row('Total', this.formatMoney(invoice.total, invoice.currency), true);

    this.drawDivider(doc);
    doc.moveDown(0.5);

    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10);
    doc.text('Notes', { underline: true });
    doc.text(
      'Thank you for your business. Please remit payment by the due date.',
    );
    if (this.business.email)
      doc.text(`For any questions, contact ${this.business.email}.`);
  }

  private renderFooter(doc: PDFKit.PDFDocument) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.accent)
        .fontSize(9)
        .text('Payment is due in full upon receipt.', PAGE_MARGIN, 780, {
          align: 'center',
          width: PAGE_WIDTH - PAGE_MARGIN,
        });
    }
  }

  private drawDivider(doc: PDFKit.PDFDocument) {
    doc
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(PAGE_WIDTH, doc.y)
      .stroke();
    doc.moveDown(1);
  }
}
