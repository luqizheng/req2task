import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { RawRequirementCollection } from './raw-requirement-collection.entity';
import { RawRequirement } from './raw-requirement.entity';
import { ConversationMessage } from './conversation-message.entity';

export enum ConversationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'collection_id', type: 'uuid', nullable: true })
  collectionId!: string | null;

  @ManyToOne(() => RawRequirementCollection, (c) => c.rawRequirements, { nullable: true })
  @JoinColumn({ name: 'collection_id' })
  collection!: RawRequirementCollection | null;

  @Column({ name: 'raw_requirement_id', type: 'uuid', nullable: true })
  rawRequirementId!: string | null;

  @ManyToOne(() => RawRequirement, (r) => r.conversation, { nullable: true })
  @JoinColumn({ name: 'raw_requirement_id' })
  rawRequirement!: RawRequirement | null;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status!: ConversationStatus;

  @OneToMany(() => ConversationMessage, (m) => m.conversation, { cascade: true })
  messages!: ConversationMessage[];

  @Column({ name: 'question_count', type: 'int', default: 0 })
  questionCount!: number;

  @Column({ name: 'message_count', type: 'int', default: 0 })
  messageCount!: number;

  @Column({ name: 'summary', type: 'text', nullable: true })
  summary!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
