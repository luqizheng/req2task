import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Requirement } from './requirement.entity';
import { User } from './user.entity';
import { ChangeType, RequirementStatus } from '@req2task/dto';

@Entity('requirement_change_logs')
export class RequirementChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'requirement_id' })
  requirementId!: string;

  @ManyToOne(() => Requirement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement!: Requirement;

  @Column({
    type: 'enum',
    enum: ChangeType,
  })
  changeType!: ChangeType;

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue!: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue!: string | null;

  @Column({ name: 'from_status', type: 'enum', enum: RequirementStatus, nullable: true })
  fromStatus!: RequirementStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: RequirementStatus, nullable: true })
  toStatus!: RequirementStatus | null;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'changed_by_id' })
  changedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by_id' })
  changedBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
