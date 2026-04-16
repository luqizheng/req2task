import { MigrationInterface, QueryRunner } from "typeorm";

export class InitRequirement1776432000000 implements MigrationInterface {
    name = 'InitRequirement1776432000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."requirements_priority_enum" AS ENUM('critical', 'high', 'medium', 'low')`);
        await queryRunner.query(`CREATE TYPE "public"."requirements_source_enum" AS ENUM('manual', 'ai_generated', 'document_import')`);
        await queryRunner.query(`CREATE TYPE "public"."requirements_status_enum" AS ENUM('draft', 'reviewed', 'approved', 'rejected', 'processing', 'completed', 'cancelled')`);

        await queryRunner.query(`CREATE TABLE "requirements" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "module_id" uuid NOT NULL,
            "title" character varying NOT NULL,
            "description" text,
            "priority" "public"."requirements_priority_enum" NOT NULL DEFAULT 'medium',
            "source" "public"."requirements_source_enum" NOT NULL DEFAULT 'manual',
            "status" "public"."requirements_status_enum" NOT NULL DEFAULT 'draft',
            "story_points" integer NOT NULL DEFAULT '0',
            "parent_id" uuid,
            "created_by_id" uuid NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_4d0157c3d2e9e5f3a1f7e8c0d6" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TYPE "public"."acceptance_criteria_criteria_type_enum" AS ENUM('functional', 'non_functional', 'performance', 'security', 'usability')`);

        await queryRunner.query(`CREATE TABLE "user_stories" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "requirement_id" uuid NOT NULL,
            "role" character varying NOT NULL,
            "goal" text NOT NULL,
            "benefit" text NOT NULL,
            "story_points" integer NOT NULL DEFAULT '0',
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_2c2d6e8f1a3b4c5d6e7f8a9b0c" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE "acceptance_criteria" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_story_id" uuid NOT NULL,
            "criteria_type" "public"."acceptance_criteria_criteria_type_enum" NOT NULL DEFAULT 'functional',
            "content" text NOT NULL,
            "test_method" character varying,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_3a1b2c3d4e5f6a7b8c9d0e1f2a" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE INDEX "IDX_requirements_module_id" ON "requirements" ("module_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_requirements_parent_id" ON "requirements" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_requirements_created_by_id" ON "requirements" ("created_by_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_stories_requirement_id" ON "user_stories" ("requirement_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_acceptance_criteria_user_story_id" ON "acceptance_criteria" ("user_story_id") `);

        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_requirements_module_id" FOREIGN KEY ("module_id") REFERENCES "feature_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_requirements_parent_id" FOREIGN KEY ("parent_id") REFERENCES "requirements"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_requirements_created_by_id" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_stories" ADD CONSTRAINT "FK_user_stories_requirement_id" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "FK_acceptance_criteria_user_story_id" FOREIGN KEY ("user_story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "acceptance_criteria" DROP CONSTRAINT "FK_acceptance_criteria_user_story_id"`);
        await queryRunner.query(`ALTER TABLE "user_stories" DROP CONSTRAINT "FK_user_stories_requirement_id"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_requirements_created_by_id"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_requirements_parent_id"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_requirements_module_id"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_acceptance_criteria_user_story_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_stories_requirement_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_requirements_created_by_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_requirements_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_requirements_module_id"`);

        await queryRunner.query(`DROP TABLE "acceptance_criteria"`);
        await queryRunner.query(`DROP TABLE "user_stories"`);
        await queryRunner.query(`DROP TABLE "requirements"`);

        await queryRunner.query(`DROP TYPE "public"."requirements_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."requirements_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."requirements_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."acceptance_criteria_criteria_type_enum"`);
    }
}
