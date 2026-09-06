import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column()
  subject: string;

  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any> | null;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
