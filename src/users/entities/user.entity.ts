import { Role } from 'src/iam/authorization/roles/entities/role.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ type: 'varchar', select: false, nullable: true })
  hashedRefreshToken: string | null;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ type: 'enum', enum: ['free', 'pro'], default: 'free' })
  plan: string;

  @Column({ select: false, type: 'varchar', nullable: true })
  twoFaSecret: string | null;

  @Column({ default: false })
  isTwoFaEnabled: boolean;

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
