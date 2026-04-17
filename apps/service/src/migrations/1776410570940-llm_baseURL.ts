import { MigrationInterface, QueryRunner } from "typeorm";

export class LlmBaseURL1776410570940 implements MigrationInterface {
    name = 'LlmBaseURL1776410570940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."acceptance_criteria_criteriatype_enum" AS ENUM('functional', 'non_functional', 'performance', 'security', 'usability')`);
        await queryRunner.query(`CREATE TABLE "acceptance_criteria" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_story_id" uuid NOT NULL, "criteriaType" "public"."acceptance_criteria_criteriatype_enum" NOT NULL DEFAULT 'functional', "content" text NOT NULL, "test_method" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c2ea9c3ca5e197f3b89d8bb5816" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_stories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requirement_id" uuid NOT NULL, "role" character varying NOT NULL, "goal" text NOT NULL, "benefit" text NOT NULL, "story_points" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2eb2857c3f0754ea3260194524b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."requirements_priority_enum" AS ENUM('critical', 'high', 'medium', 'low')`);
        await queryRunner.query(`CREATE TYPE "public"."requirements_source_enum" AS ENUM('manual', 'ai_generated', 'document_import')`);
        await queryRunner.query(`CREATE TYPE "public"."requirements_status_enum" AS ENUM('draft', 'reviewed', 'approved', 'rejected', 'processing', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "requirements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "module_id" uuid NOT NULL, "title" character varying NOT NULL, "description" text, "priority" "public"."requirements_priority_enum" NOT NULL DEFAULT 'medium', "source" "public"."requirements_source_enum" NOT NULL DEFAULT 'manual', "status" "public"."requirements_status_enum" NOT NULL DEFAULT 'draft', "story_points" integer NOT NULL DEFAULT '0', "parent_id" uuid, "created_by_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4e966e20a0ebaf89e4c1ed664a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."requirement_change_logs_changetype_enum" AS ENUM('status_change', 'content_change', 'priority_change', 'assignee_change', 'review_result')`);
        await queryRunner.query(`CREATE TYPE "public"."requirement_change_logs_from_status_enum" AS ENUM('draft', 'reviewed', 'approved', 'rejected', 'processing', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "public"."requirement_change_logs_to_status_enum" AS ENUM('draft', 'reviewed', 'approved', 'rejected', 'processing', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "requirement_change_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requirement_id" uuid NOT NULL, "changeType" "public"."requirement_change_logs_changetype_enum" NOT NULL, "old_value" text, "new_value" text, "from_status" "public"."requirement_change_logs_from_status_enum", "to_status" "public"."requirement_change_logs_to_status_enum", "comment" text, "changed_by_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8998b5474e3e43f675e3dcdc944" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('todo', 'in_progress', 'in_review', 'done', 'blocked')`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_priority_enum" AS ENUM('urgent', 'high', 'medium', 'low')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_no" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "requirement_id" uuid NOT NULL, "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'todo', "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'medium', "assigned_to_id" uuid, "estimated_hours" numeric(10,2), "actual_hours" numeric(10,2), "due_date" TIMESTAMP, "parent_task_id" uuid, "created_by_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dcf498eb49a3684b842e6dc3be8" UNIQUE ("task_no"), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'user', 'projectManager', 'requirementAnalyst', 'developer', 'tester')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"text"::"public"."user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "FK_56107574c14411e36a3048da20e" FOREIGN KEY ("user_story_id") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_stories" ADD CONSTRAINT "FK_7a4ff6bf9b6295c708107c1e6b4" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_5081b0520428f213d7d4346a5cd" FOREIGN KEY ("module_id") REFERENCES "feature_modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_ddd5581013807b79e0eee43ee95" FOREIGN KEY ("parent_id") REFERENCES "requirements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_29037e58d8cdd8dce651a7d1e6c" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requirement_change_logs" ADD CONSTRAINT "FK_049f3462c9ad349d74b6394cb7f" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requirement_change_logs" ADD CONSTRAINT "FK_6b6c4b7c15baa8836750b1d8ab4" FOREIGN KEY ("changed_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_e59c64a05e73b0ff02eb72206b6" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9430f12c5a1604833f64595a57f" FOREIGN KEY ("assigned_to_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_54fc42a253a8338488ec1f960ad" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_0804c9432857e4d333583f5afe1" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_0804c9432857e4d333583f5afe1"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_54fc42a253a8338488ec1f960ad"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9430f12c5a1604833f64595a57f"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_e59c64a05e73b0ff02eb72206b6"`);
        await queryRunner.query(`ALTER TABLE "requirement_change_logs" DROP CONSTRAINT "FK_6b6c4b7c15baa8836750b1d8ab4"`);
        await queryRunner.query(`ALTER TABLE "requirement_change_logs" DROP CONSTRAINT "FK_049f3462c9ad349d74b6394cb7f"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_29037e58d8cdd8dce651a7d1e6c"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_ddd5581013807b79e0eee43ee95"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_5081b0520428f213d7d4346a5cd"`);
        await queryRunner.query(`ALTER TABLE "user_stories" DROP CONSTRAINT "FK_7a4ff6bf9b6295c708107c1e6b4"`);
        await queryRunner.query(`ALTER TABLE "acceptance_criteria" DROP CONSTRAINT "FK_56107574c14411e36a3048da20e"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum_old" AS ENUM('admin', 'user', 'projectManager')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
        await queryRunner.query(`DROP TABLE "requirement_change_logs"`);
        await queryRunner.query(`DROP TYPE "public"."requirement_change_logs_to_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."requirement_change_logs_from_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."requirement_change_logs_changetype_enum"`);
        await queryRunner.query(`DROP TABLE "requirements"`);
        await queryRunner.query(`DROP TYPE "public"."requirements_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."requirements_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."requirements_priority_enum"`);
        await queryRunner.query(`DROP TABLE "user_stories"`);
        await queryRunner.query(`DROP TABLE "acceptance_criteria"`);
        await queryRunner.query(`DROP TYPE "public"."acceptance_criteria_criteriatype_enum"`);
    }

}
