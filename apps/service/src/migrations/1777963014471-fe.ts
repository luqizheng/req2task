import { MigrationInterface, QueryRunner } from "typeorm";

export class Fe1777963014471 implements MigrationInterface {
    name = 'Fe1777963014471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requirements" RENAME COLUMN "content" TO "feature_points"`);
        await queryRunner.query(`CREATE TYPE "public"."projects_system_type_enum" AS ENUM('ECOMMERCE', 'CMS', 'ERP', 'CRM', 'OA', 'LMS', 'MES', 'SCM', 'HEALTHCARE', 'FINTECH', 'IOT', 'GAMING', 'SOCIAL', 'EDUCATION', 'CUSTOM')`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "system_type" "public"."projects_system_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."projects_architecture_type_enum" AS ENUM('MONOLITHIC', 'MICROSERVICE', 'SERVERLESS', 'MICROSERVICE_MONO_REPO', 'MODULAR_MONOLITH', 'EVENT_DRIVEN', 'LAYERED', 'HEXAGONAL', 'DDD')`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "architecture_type" "public"."projects_architecture_type_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "tech_stack" jsonb`);
        await queryRunner.query(`CREATE TYPE "public"."projects_database_types_enum" AS ENUM('POSTGRESQL', 'MYSQL', 'MONGODB', 'REDIS', 'ELASTICSEARCH', 'MARIADB', 'ORACLE', 'SQLSERVER', 'SQLITE', 'DYNAMODB', 'COUCHDB', 'NEO4J', 'TIMESERIES')`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "database_types" "public"."projects_database_types_enum" array`);
        await queryRunner.query(`CREATE TYPE "public"."projects_cloud_provider_enum" AS ENUM('ALIYUN', 'TENCENT', 'HUAWEI', 'AWS', 'GCP', 'AZURE', 'SELF_HOSTED')`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "cloud_provider" "public"."projects_cloud_provider_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."projects_security_level_enum" AS ENUM('BASIC', 'STANDARD', 'ENHANCED', 'HIGH')`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "security_level" "public"."projects_security_level_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."projects_project_scale_enum" AS ENUM('SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE')`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "project_scale" "public"."projects_project_scale_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "team_size" integer`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "is_microservices" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "expected_duration_months" integer`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "budget" numeric`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "business_domain" text`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "target_audience" text`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "wizard_completed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "wizard_config" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "wizard_config"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "wizard_completed"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "target_audience"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "business_domain"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "budget"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "expected_duration_months"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "is_microservices"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "team_size"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "project_scale"`);
        await queryRunner.query(`DROP TYPE "public"."projects_project_scale_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "security_level"`);
        await queryRunner.query(`DROP TYPE "public"."projects_security_level_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "cloud_provider"`);
        await queryRunner.query(`DROP TYPE "public"."projects_cloud_provider_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "database_types"`);
        await queryRunner.query(`DROP TYPE "public"."projects_database_types_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "tech_stack"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "architecture_type"`);
        await queryRunner.query(`DROP TYPE "public"."projects_architecture_type_enum"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "system_type"`);
        await queryRunner.query(`DROP TYPE "public"."projects_system_type_enum"`);
        await queryRunner.query(`ALTER TABLE "requirements" RENAME COLUMN "feature_points" TO "content"`);
    }

}
