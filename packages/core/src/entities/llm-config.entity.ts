import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LLMProviderType } from '@req2task/dto';

@Entity('llm_configs')
export class LLMConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: LLMProviderType,
    default: LLMProviderType.DEEPSEEK,
  })
  provider!: LLMProviderType;

  @Column()
  apiKey!: string;

  @Column({ type: 'varchar', nullable: true })
  baseUrl!: string | null;

  @Column({ name: 'model_name' })
  modelName!: string;

  @Column({ name: 'max_tokens', type: 'int', default: 4096 })
  maxTokens!: number;

  @Column({ name: 'temperature', type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
