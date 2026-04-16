import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitRequirementChangeLog1744792800000 implements MigrationInterface {
  name = 'InitRequirementChangeLog1744792800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "requirement_change_logs_change_type_enum" AS ENUM (
        'status_change',
        'content_change',
        'priority_change',
        'assignee_change',
        'review_result'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "requirement_change_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requirement_id" uuid NOT NULL,
        "change_type" "requirement_change_logs_change_type_enum" NOT NULL,
        "old_value" text,
        "new_value" text,
        "from_status" varchar(50),
        "to_status" varchar(50),
        "comment" text,
        "changed_by_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_requirement_change_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "requirement_change_logs" 
      ADD CONSTRAINT "FK_requirement_change_logs_requirement" 
      FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "requirement_change_logs" 
      ADD CONSTRAINT "FK_requirement_change_logs_user" 
      FOREIGN KEY ("changed_by_id") REFERENCES "user"("id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requirement_change_logs" DROP CONSTRAINT "FK_requirement_change_logs_requirement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requirement_change_logs" DROP CONSTRAINT "FK_requirement_change_logs_user"`,
    );
    await queryRunner.query(`DROP TABLE "requirement_change_logs"`);
    await queryRunner.query(`DROP TYPE "requirement_change_logs_change_type_enum"`);
  }
}
