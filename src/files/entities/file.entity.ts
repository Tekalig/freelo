// files/entities/attachment.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Invoice } from '../../invoicing/entities/invoice.entity';

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'CASCADE' })
  project: Project | null;

  @ManyToOne(() => Invoice, { nullable: true, onDelete: 'CASCADE' })
  invoice: Invoice | null;

  @Column()
  fileKey: string; // the object's key/path in the bucket, e.g. "user-id/uuid-filename.pdf"

  @Column()
  fileName: string; // original file name, for display

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  sizeBytes: number;

  @CreateDateColumn()
  createdAt: Date;
}
