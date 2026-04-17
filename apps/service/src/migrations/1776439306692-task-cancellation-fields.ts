import { MigrationInterface, QueryRunner } from "typeorm";

export class TaskCancellationFields1776439306692 implements MigrationInterface {
    name = 'TaskCancellationFields1776439306692'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_9d5f4c8e3a2e4f6c7b8d9e0f1a2b"`);
        await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT "FK_0c35e3e94e3959d6d8c2e3c3d6c"`);
        await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT "FK_9e468410dc6c3a72d8e12e3d9b8"`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD "source_raw_requirement_id" uuid`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "replaced_by_task_id" uuid`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "cancelled_reason" text`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "cancellation_type" character varying(50)`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'user', 'projectManager', 'requirementAnalyst', 'developer', 'tester')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"text"::"public"."user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."project_status_enum" RENAME TO "project_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."projects_status_enum" AS ENUM('planning', 'active', 'on_hold', 'completed', 'archived')`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "status" TYPE "public"."projects_status_enum" USING "status"::"text"::"public"."projects_status_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'planning'`);
        await queryRunner.query(`DROP TYPE "public"."project_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "owner_id"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "owner_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."tasks_status_enum" RENAME TO "tasks_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "public"."tasks_status_enum" USING "status"::"text"::"public"."tasks_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo'`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_b5729113570c20c7e214cf3f58" ON "project_members" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e89aae80e010c2faa72e6a49ce" ON "project_members" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "feature_modules" ADD CONSTRAINT "FK_f6e529d44162985c833e0d77557" FOREIGN KEY ("parent_id") REFERENCES "feature_modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feature_modules" ADD CONSTRAINT "FK_1a7cd479d68971fa2bf907da838" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_2a03f2cd4af23bb309b920f34d3" FOREIGN KEY ("replaced_by_task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "FK_b5729113570c20c7e214cf3f58d" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8"`);
        await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT "FK_b5729113570c20c7e214cf3f58d"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_2a03f2cd4af23bb309b920f34d3"`);
        await queryRunner.query(`ALTER TABLE "feature_modules" DROP CONSTRAINT "FK_1a7cd479d68971fa2bf907da838"`);
        await queryRunner.query(`ALTER TABLE "feature_modules" DROP CONSTRAINT "FK_f6e529d44162985c833e0d77557"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e89aae80e010c2faa72e6a49ce"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5729113570c20c7e214cf3f58"`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum_old" AS ENUM('todo', 'in_progress', 'in_review', 'done', 'blocked')`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "public"."tasks_status_enum_old" USING "status"::"text"::"public"."tasks_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo'`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tasks_status_enum_old" RENAME TO "tasks_status_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "owner_id"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "owner_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."project_status_enum_old" AS ENUM('planning', 'active', 'on_hold', 'completed', 'archived')`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "status" TYPE "public"."project_status_enum_old" USING "status"::"text"::"public"."project_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'planning'`);
        await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."project_status_enum_old" RENAME TO "project_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum_old" AS ENUM('admin', 'user', 'projectManager')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "cancellation_type"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "cancelled_reason"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "replaced_by_task_id"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "source_raw_requirement_id"`);
        await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "FK_9e468410dc6c3a72d8e12e3d9b8" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "FK_0c35e3e94e3959d6d8c2e3c3d6c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_9d5f4c8e3a2e4f6c7b8d9e0f1a2b" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
