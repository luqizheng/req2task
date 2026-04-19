import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FileData } from './file-data.entity';
import { User } from './user.entity';
import { AttachmentTargetType } from '@req2task/dto';

@Entity('project_attachments')
@Index(['targetType', 'targetId'])
export class ProjectAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'file_data_id', type: 'uuid' })
  fileDataId!: string;

  @ManyToOne(() => FileData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_data_id' })
  fileData!: FileData;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: AttachmentTargetType,
  })
  targetType!: AttachmentTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
