import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LLMProviderType } from '../../types.js';

@Entity('llm_configs')
export class LLMConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: LLMProviderType,
    default: LLMProviderType.OPENAI,
  })
  provider!: LLMProviderType;

  @Column({ type: 'varchar', length: 500, select: false })
  apiKey!: string;

  @Column({ name: 'base_url', type: 'varchar', nullable: true })
  baseUrl!: string | null;

  @Column({ name: 'model_name', type: 'varchar', length: 100 })
  modelName!: string;

  @Column({ name: 'max_tokens', type: 'int', default: 4096 })
  maxTokens!: number;

  @Column({ name: 'temperature', type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature!: number;

  @Column({ name: 'top_p', type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  topP!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
