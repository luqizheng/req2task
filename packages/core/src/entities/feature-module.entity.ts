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

@Entity('feature_modules')
export class FeatureModule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'module_key' })
  moduleKey!: string;

  @Column({ default: 0 })
  sort!: number;

  @Column({ name: 'parent_id', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => FeatureModule, (module) => module.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: FeatureModule | null;

  @OneToMany(() => FeatureModule, (module) => module.parent)
  children!: FeatureModule[];

  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
