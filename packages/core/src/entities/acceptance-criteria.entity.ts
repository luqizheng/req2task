import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserStory } from './user-story.entity';

export enum CriteriaType {
  FUNCTIONAL = 'functional',
  NON_FUNCTIONAL = 'non_functional',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  USABILITY = 'usability',
}

@Entity('acceptance_criteria')
export class AcceptanceCriteria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_story_id' })
  userStoryId!: string;

  @ManyToOne(() => UserStory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_story_id' })
  userStory!: UserStory;

  @Column({
    type: 'enum',
    enum: CriteriaType,
    default: CriteriaType.FUNCTIONAL,
  })
  criteriaType!: CriteriaType;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'test_method', nullable: true })
  testMethod!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
