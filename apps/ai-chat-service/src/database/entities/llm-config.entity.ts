import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type LLMProviderTypeLiteral = 'deepseek' | 'openai' | 'ollama';

@Entity('llm_configs')
export class LLMConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: ['deepseek', 'openai', 'ollama'] as const,
    default: 'deepseek',
  })
  provider!: LLMProviderTypeLiteral;

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

  @Column({ name: 'top_p', type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  topP!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
