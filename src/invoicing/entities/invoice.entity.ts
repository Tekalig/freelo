import { Client } from 'src/clients/entities/client.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { InvoiceLineItem } from './invoice-line-item.entity';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  client: Client;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.Draft })
  status: InvoiceStatus;

  @Column({ type: 'date' })
  issueDate: string;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'int' })
  subtotal: number;

  @Column({ type: 'int', default: 0 })
  tax: number;

  @Column({ type: 'int' })
  total: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', nullable: true })
  pdfUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripePaymentLinkUrl: string | null;

  @OneToMany(() => InvoiceLineItem, (item) => item.invoice, { cascade: true })
  lineItems: InvoiceLineItem[];

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
