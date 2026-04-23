import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { ConversationStatus } from "@req2task/dto";
import { ConversationMessage } from "./conversation-message.entity";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "next_conversation_id", type: "uuid", nullable: true })
  nextConversationId!: string | null;

  @Column({ name: "title", type: "varchar", length: 255, nullable: true })
  title!: string | null;

  @Column({
    type: "enum",
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status!: ConversationStatus;

  @OneToMany(() => ConversationMessage, (m) => m.conversation, {
    cascade: true,
  })
  messages!: ConversationMessage[];

  @Column({ name: "message_count", type: "int", default: 0 })
  messageCount!: number;

  @Column({ name: "summary", type: "text", nullable: true })
  summary!: string | null;

  @Column({ name: "conversation_type", type: "varchar", length: 50, default: "general" })
  conversationType!: string;

  @Column({ name: "metadata", type: "json", nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
