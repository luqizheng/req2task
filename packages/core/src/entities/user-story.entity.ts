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
import { Requirement } from './requirement.entity';
import { AcceptanceCriteria } from './acceptance-criteria.entity';

@Entity('user_stories')
export class UserStory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'requirement_id' })
  requirementId!: string;

  @ManyToOne(() => Requirement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement!: Requirement;

  @Column()
  role!: string;

  @Column({ type: 'text' })
  goal!: string;

  @Column({ type: 'text' })
  benefit!: string;

  @Column({ name: 'story_points', type: 'int', default: 0 })
  storyPoints!: number;

  @OneToMany(() => AcceptanceCriteria, (ac) => ac.userStory)
  acceptanceCriteria!: AcceptanceCriteria[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
