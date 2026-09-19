import { Client } from 'src/clients/entities/client.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus } from '../enums/project-status.enum';

@Entity()
@Unique(['client', 'name'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  client: Client;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: ProjectStatus.Active, type: 'enum', enum: ProjectStatus })
  status: ProjectStatus;

  @Column({ nullable: true, type: 'decimal', scale: 2, precision: 10 })
  hourlyRate: string | null;

  @Column({ default: 'USD' })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
