import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRawRequirementCollection1745023400000 implements MigrationInterface {
  name = 'AddRawRequirementCollection1745023400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."raw_requirement_collections_collection_type_enum" AS ENUM('meeting', 'interview', 'document', 'other')`);

    await queryRunner.query(`CREATE TABLE "raw_requirement_collections" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "project_id" uuid NOT NULL,
      "title" character varying NOT NULL,
      "collection_type" "public"."raw_requirement_collections_collection_type_enum" NOT NULL,
      "collected_by_id" uuid NOT NULL,
      "collected_at" TIMESTAMP NOT NULL,
      "meeting_minutes" text,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_raw_requirement_collections" PRIMARY KEY ("id")
    )`);

    await queryRunner.query(`ALTER TABLE "raw_requirements" ADD COLUMN "collection_id" uuid`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" ADD COLUMN "source" character varying(200)`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" ADD COLUMN "session_history" jsonb`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" ADD COLUMN "follow_up_questions" jsonb`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" ADD COLUMN "key_elements" jsonb`);

    await queryRunner.query(`CREATE INDEX "IDX_raw_requirements_collection_id" ON "raw_requirements" ("collection_id") `);

    await queryRunner.query(`ALTER TABLE "raw_requirement_collections" ADD CONSTRAINT "FK_raw_requirement_collections_project_id" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "raw_requirement_collections" ADD CONSTRAINT "FK_raw_requirement_collections_collected_by_id" FOREIGN KEY ("collected_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" ADD CONSTRAINT "FK_raw_requirements_collection_id" FOREIGN KEY ("collection_id") REFERENCES "raw_requirement_collections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP CONSTRAINT "FK_raw_requirements_collection_id"`);
    await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP CONSTRAINT "FK_raw_requirement_collections_collected_by_id"`);
    await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP CONSTRAINT "FK_raw_requirement_collections_project_id"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_raw_requirements_collection_id"`);

    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "key_elements"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "follow_up_questions"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "session_history"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "source"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "collection_id"`);

    await queryRunner.query(`DROP TABLE "raw_requirement_collections"`);
    await queryRunner.query(`DROP TYPE "public"."raw_requirement_collections_collection_type_enum"`);
  }
}
