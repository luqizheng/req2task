import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Requirement } from './requirement.entity';
import { Project } from './project.entity';
import { RawRequirementStatus, CollectionType } from '@req2task/dto';

export interface QuestionAndAnswer {
  id: string;
  question: string;
  answer: string | null;
  purpose?: string;
  createdAt: string;
  answeredAt: string | null;
}

@Entity('raw_requirements')
export class RawRequirement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({
    name: 'collection_type',
    type: 'enum',
    enum: CollectionType,
    nullable: true,
  })
  collectionType!: CollectionType | null;

  @Column({ name: 'original_content', type: 'text' })
  originalContent!: string;

  @Column({
    type: 'enum',
    enum: RawRequirementStatus,
    default: RawRequirementStatus.PENDING,
  })
  status!: RawRequirementStatus;

  @Column({ name: 'source', type: 'varchar', length: 200, nullable: true })
  source!: string | null;

  @Column({ name: 'collect_time', type: 'timestamptz', nullable: true })
  collectTime!: Date | null;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId!: string | null;

  @Column({ name: 'key_elements', type: 'json', nullable: true })
  keyElements!: string[] | null;

  @Column({ name: 'question_and_answers', type: 'json', nullable: true })
  questionAndAnswers!: QuestionAndAnswer[] | null;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @OneToMany(() => Requirement, (r) => r.sourceRawRequirement)
  requirements!: Requirement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
