import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRawRequirementModuleId1776502005774 implements MigrationInterface {
    name = 'RemoveRawRequirementModuleId1776502005774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "module_id"`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD "module_ids" text`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_5081b0520428f213d7d4346a5cd"`);
        await queryRunner.query(`ALTER TABLE "requirements" ALTER COLUMN "module_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_5081b0520428f213d7d4346a5cd" FOREIGN KEY ("module_id") REFERENCES "feature_modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_5081b0520428f213d7d4346a5cd"`);
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "requirements" ALTER COLUMN "module_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_5081b0520428f213d7d4346a5cd" FOREIGN KEY ("module_id") REFERENCES "feature_modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "module_ids"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD "module_id" character varying NOT NULL`);
    }

}
