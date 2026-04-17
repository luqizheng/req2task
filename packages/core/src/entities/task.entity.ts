import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Requirement } from './requirement.entity';
import { User } from './user.entity';
import { TaskStatus, TaskPriority } from '@req2task/dto';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'task_no', unique: true })
  taskNo!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'requirement_id' })
  requirementId!: string;

  @ManyToOne(() => Requirement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requirement_id' })
  requirement!: Requirement;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo!: User | null;

  @Column({ name: 'estimated_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedHours!: number | null;

  @Column({ name: 'actual_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualHours!: number | null;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate!: Date | null;

  @Column({ name: 'parent_task_id', nullable: true })
  parentTaskId!: string | null;

  @ManyToOne(() => Task, (task) => task.children, { nullable: true })
  @JoinColumn({ name: 'parent_task_id' })
  parentTask!: Task | null;

  @ManyToMany(() => Task, (task) => task.dependents)
  dependencies!: Task[];

  @ManyToMany(() => Task, (task) => task.dependencies)
  dependents!: Task[];

  @OneToMany(() => Task, (task) => task.parentTask)
  children!: Task[];

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
