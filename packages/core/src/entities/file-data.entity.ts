import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ProjectAttachment } from './project-attachment.entity';

export enum FileStatus {
  NORMAL = 'normal',
  PENDING_DELETE = 'pending_delete',
}

@Entity('file_data')
export class FileData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'file_hash', type: 'varchar', length: 32 }) // MD5 hash is 32 chars
  fileHash!: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'bigint' })
  size!: number;

  @Column({ name: 'storage_path', type: 'varchar', length: 500 })
  storagePath!: string;

  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: FileStatus, 
    default: FileStatus.PENDING_DELETE 
  })
  status!: FileStatus;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => ProjectAttachment, (attachment) => attachment.fileData)
  attachments!: ProjectAttachment[];
}