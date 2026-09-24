import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class InvoicePdfService {
  async generate(invoice: Invoice): Promise<Buffer> {
    const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const formatDate = (value: string | Date | undefined) => {
      if (!value) return 'N/A';
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
    };

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1f2937';
      const accentColor = '#2563eb';
      const mutedColor = '#6b7280';
      const borderColor = '#d1d5db';

      doc
        .fillColor(primaryColor)
        .fontSize(26)
        .font('Helvetica-Bold')
        .text('INVOICE', {
          align: 'left',
        });

      doc.moveDown(0.4);
      doc.fontSize(11).fillColor(mutedColor).font('Helvetica');
      doc.text('Your Company LLC', { align: 'left' });
      doc.text('123 Business Avenue', { align: 'left' });
      doc.text('New York, NY 10001', { align: 'left' });
      doc.text('hello@yourcompany.com | (212) 555-0101', { align: 'left' });

      const invoiceMetaX = 390;
      const invoiceMetaY = 60;
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12);
      doc.text(`Invoice #${invoice.invoiceNumber}`, invoiceMetaX, invoiceMetaY);
      doc.font('Helvetica').fontSize(10).fillColor(mutedColor);
      doc.text(
        `Issue date: ${formatDate(invoice.issueDate)}`,
        invoiceMetaX,
        invoiceMetaY + 18,
      );
      doc.text(
        `Due date: ${formatDate(invoice.dueDate)}`,
        invoiceMetaX,
        invoiceMetaY + 32,
      );
      doc.text(`Status: ${invoice.status}`, invoiceMetaX, invoiceMetaY + 46);

      doc.moveDown(2.5);
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
      doc.moveDown(1);

      const billToTop = doc.y;
      doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Bill To');
      doc.font('Helvetica').fontSize(10).fillColor(mutedColor);
      doc.text('Acme Customer', 50, billToTop + 20);
      doc.text('456 Market Street', 50, billToTop + 36);
      doc.text('San Francisco, CA 94105', 50, billToTop + 52);
      doc.text('billing@acmecustomer.com', 50, billToTop + 68);

      const totalsTop = doc.y + 8;
      doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Payment Details', 390, totalsTop);
      doc.font('Helvetica').fontSize(10).fillColor(mutedColor);
      doc.text('Bank: First National Bank', 390, totalsTop + 18);
      doc.text('Account: 123456789', 390, totalsTop + 34);
      doc.text('Routing: 021000021', 390, totalsTop + 50);

      doc.moveDown(3.5);

      const tableTop = doc.y;
      const rowHeight = 22;
      const columns = [
        { x: 50, width: 240, label: 'Description' },
        { x: 300, width: 50, label: 'Qty' },
        { x: 360, width: 80, label: 'Rate' },
        { x: 455, width: 90, label: 'Amount' },
      ];

      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10);
      for (const col of columns) {
        doc.text(col.label, col.x, tableTop, {
          width: col.width,
          align: 'left',
        });
      }

      doc
        .strokeColor(borderColor)
        .moveTo(50, tableTop + 16)
        .lineTo(545, tableTop + 16)
        .stroke();

      let yPosition = tableTop + 22;
      doc.font('Helvetica').fillColor(primaryColor).fontSize(10);
      for (const item of invoice.lineItems) {
        doc.text(item.description, 50, yPosition, { width: 240, lineGap: 2 });
        doc.text(String(item.quantity), 300, yPosition);
        doc.text(formatMoney(item.unitPrice), 360, yPosition);
        doc.text(formatMoney(item.amount), 455, yPosition);
        yPosition += rowHeight;
      }

      doc
        .strokeColor(borderColor)
        .moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .stroke();
      doc.moveDown(1.2);

      const summaryX = 360;
      doc.font('Helvetica').fontSize(10).fillColor(primaryColor);
      doc.text(`Subtotal`, summaryX, doc.y, { width: 90, align: 'left' });
      doc.text(formatMoney(invoice.subtotal), 455, doc.y, {
        width: 90,
        align: 'right',
      });
      doc.text(`Tax`, summaryX, doc.y + 18, { width: 90, align: 'left' });
      doc.text(formatMoney(invoice.tax), 455, doc.y + 18, {
        width: 90,
        align: 'right',
      });
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text(`Total`, summaryX, doc.y + 36, { width: 90, align: 'left' });
      doc.text(formatMoney(invoice.total), 455, doc.y + 36, {
        width: 90,
        align: 'right',
      });

      doc.moveDown(2.5);
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
      doc.moveDown(1.2);
      doc.fillColor(mutedColor).font('Helvetica').fontSize(10);
      doc.text('Notes', { underline: true, continued: false });
      doc.text(
        'Thank you for your business. Please remit payment by the due date.',
      );
      doc.text('For any questions, contact accounts@yourcompany.com.');

      doc.font('Helvetica-Bold').fillColor(accentColor).fontSize(11);
      doc.text('Payment is due in full upon receipt.', 50, 760, {
        align: 'center',
      });

      doc.end();
    });
  }
}
