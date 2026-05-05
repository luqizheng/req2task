import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { ProjectStatus } from '@req2task/dto';
import { SystemType, ArchitectureType, DatabaseType, CloudProvider, SecurityLevel, ProjectScale } from '@req2task/dto';

export { SystemType, ArchitectureType, DatabaseType, CloudProvider, SecurityLevel, ProjectScale };

export interface TechStack {
  frontend?: {
    framework?: string;
    uiLibrary?: string;
    stateManagement?: string;
    buildTool?: string;
    language?: string;
    otherTechnologies?: string[];
  };
  backend?: {
    framework?: string;
    language?: string;
    orm?: string;
    apiStyle?: string;
    caching?: string[];
    messageQueue?: string[];
    otherTechnologies?: string[];
  };
  infrastructure?: {
    container?: string;
    orchestration?: string;
    reverseProxy?: string;
    loadBalancer?: string;
  };
  devops?: {
    ciCd?: string;
    containerRegistry?: string;
    monitoring?: string[];
    logging?: string[];
    tracing?: string;
    codeQuality?: string[];
  };
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'project_key', unique: true })
  projectKey!: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status!: ProjectStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: Date | null;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'project_members',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members!: User[];

  @Column({ name: 'owner_id' })
  ownerId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({
    type: 'enum',
    enum: SystemType,
    nullable: true,
    name: 'system_type',
  })
  systemType!: SystemType | null;

  @Column({
    type: 'enum',
    enum: ArchitectureType,
    nullable: true,
    name: 'architecture_type',
  })
  architectureType!: ArchitectureType | null;

  @Column({ type: 'jsonb', nullable: true, name: 'tech_stack' })
  techStack!: TechStack | null;

  @Column({
    type: 'enum',
    enum: DatabaseType,
    array: true,
    nullable: true,
    name: 'database_types',
  })
  databaseTypes!: DatabaseType[];

  @Column({
    type: 'enum',
    enum: CloudProvider,
    nullable: true,
    name: 'cloud_provider',
  })
  cloudProvider!: CloudProvider | null;

  @Column({
    type: 'enum',
    enum: SecurityLevel,
    nullable: true,
    name: 'security_level',
  })
  securityLevel!: SecurityLevel | null;

  @Column({
    type: 'enum',
    enum: ProjectScale,
    nullable: true,
    name: 'project_scale',
  })
  projectScale!: ProjectScale | null;

  @Column({ type: 'int', nullable: true, name: 'team_size' })
  teamSize!: number | null;

  @Column({ type: 'boolean', default: false, name: 'is_microservices' })
  isMicroservices!: boolean;

  @Column({ type: 'int', nullable: true, name: 'expected_duration_months' })
  expectedDurationMonths!: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'budget' })
  budget!: number | null;

  @Column({ type: 'text', nullable: true, name: 'business_domain' })
  businessDomain!: string | null;

  @Column({ type: 'text', nullable: true, name: 'target_audience' })
  targetAudience!: string | null;

  @Column({ type: 'boolean', default: false, name: 'wizard_completed' })
  wizardCompleted!: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'wizard_config' })
  wizardConfig!: Record<string, unknown> | null;
}
