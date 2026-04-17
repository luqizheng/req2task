import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Requirement } from './requirement.entity';
import { RawRequirementStatus } from '@req2task/dto';

@Entity('raw_requirements')
export class RawRequirement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'module_id' })
  moduleId!: string;

  @Column({ name: 'original_content', type: 'text' })
  originalContent!: string;

  @Column({ name: 'generated_requirement_id', nullable: true })
  generatedRequirementId!: string | null;

  @ManyToOne(() => Requirement, { nullable: true })
  @JoinColumn({ name: 'generated_requirement_id' })
  generatedRequirement!: Requirement | null;

  @Column({
    type: 'enum',
    enum: RawRequirementStatus,
    default: RawRequirementStatus.PENDING,
  })
  status!: RawRequirementStatus;

  @Column({ name: 'generated_content', type: 'text', nullable: true })
  generatedContent!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
