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
import { FeatureModule } from './feature-module.entity';
import { User } from './user.entity';
import { UserStory } from './user-story.entity';
import { RawRequirement } from './raw-requirement.entity';
import { RequirementStatus, Priority, RequirementSource } from '@req2task/dto';
import { Conversation } from './conversation.entity';

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'module_id', nullable: true })
  moduleId!: string | null;

  @ManyToOne(() => FeatureModule, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'module_id' })
  module!: FeatureModule | null;

  @Column({ name: 'module_ids', type: 'simple-array', nullable: true })
  moduleIds!: string[] | null;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority!: Priority;

  @Column({
    name: 'source',
    type: 'enum',
    enum: RequirementSource,
    default: RequirementSource.MANUAL,
  })
  source!: RequirementSource;

  @Column({
    type: 'enum',
    enum: RequirementStatus,
    default: RequirementStatus.DRAFT,
  })
  status!: RequirementStatus;

  @Column({ name: 'story_points', type: 'int', default: 0 })
  storyPoints!: number;

  @Column({ name: 'parent_id', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Requirement, (req) => req.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: Requirement | null;

  @OneToMany(() => Requirement, (req) => req.parent)
  children!: Requirement[];

  @Column({ name: 'source_raw_requirement_id', type: 'uuid', nullable: true })
  sourceRawRequirementId!: string | null;

  @ManyToOne(() => RawRequirement, { nullable: true })
  @JoinColumn({ name: 'source_raw_requirement_id' })
  sourceRawRequirement!: RawRequirement | null;

  @OneToMany(() => UserStory, (us) => us.requirement)
  userStories!: UserStory[];

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId!: string | null;

  @ManyToOne(() => Conversation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation | null;

  @Column({ name: 'review_chain_id', type: 'uuid', nullable: true })
  reviewChainId!: string | null;

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
