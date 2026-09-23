import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Invoice } from './invoice.entity';
import { TimeEntry } from 'src/time-tracking/entities/time-entry.entity';

@Entity()
export class InvoiceLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.lineItems, {
    onDelete: 'CASCADE',
  })
  invoice: Invoice;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: string;

  @Column({ type: 'int' })
  unitPrice: number;

  @Column({ type: 'int' })
  amount: number;

  @ManyToOne(() => TimeEntry, { nullable: true, onDelete: 'SET NULL' })
  timeEntry: TimeEntry;
}
