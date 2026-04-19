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
import { RawRequirementStatus } from '@req2task/dto';
import { RawRequirementCollection } from './raw-requirement-collection.entity';
import { Conversation } from './conversation.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('raw_requirements')
export class RawRequirement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'collection_id', type: 'uuid', nullable: true })
  collectionId!: string | null;

  @ManyToOne(() => RawRequirementCollection, (c) => c.rawRequirements, { nullable: true })
  @JoinColumn({ name: 'collection_id' })
  collection!: RawRequirementCollection | null;

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

  @Column({ name: 'generated_content', type: 'text', nullable: true })
  generatedContent!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId!: string | null;

  @ManyToOne(() => Conversation, (c) => c.rawRequirement, { nullable: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation | null;

  @Column({ name: 'key_elements', type: 'json', nullable: true })
  keyElements!: string[] | null;

  @Column({ name: 'question_count', type: 'int', default: 0 })
  questionCount!: number;

  @Column({ name: 'session_history', type: 'json', nullable: true })
  sessionHistory!: ChatMessage[] | null;

  @Column({ name: 'follow_up_questions', type: 'json', nullable: true })
  followUpQuestions!: string[] | null;

  @Column({ name: 'clarified_content', type: 'text', nullable: true })
  clarifiedContent!: string | null;

  @Column({ name: 'clarified_at', type: 'timestamp', nullable: true })
  clarifiedAt!: Date | null;

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
