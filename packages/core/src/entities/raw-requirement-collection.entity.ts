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
import { Project } from './project.entity';
import { User } from './user.entity';
import { RawRequirement } from './raw-requirement.entity';
import { CollectionType } from '@req2task/dto';

@Entity('raw_requirement_collections')
export class RawRequirementCollection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column()
  title!: string;

  @Column({
    name: 'collection_type',
    type: 'enum',
    enum: CollectionType,
  })
  collectionType!: CollectionType;

  @Column({ name: 'collected_by_id' })
  collectedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'collected_by_id' })
  collectedBy!: User;

  @Column({ name: 'collected_at', type: 'timestamp' })
  collectedAt!: Date;

  @Column({ name: 'meeting_minutes', type: 'text', nullable: true })
  meetingMinutes!: string | null;

  @OneToMany(() => RawRequirement, (r) => r.collection)
  rawRequirements!: RawRequirement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
