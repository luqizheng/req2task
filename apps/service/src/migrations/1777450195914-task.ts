import { MigrationInterface, QueryRunner } from "typeorm";

export class Task1777450195914 implements MigrationInterface {
    name = 'Task1777450195914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requirements" ADD "entity_key" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "UQ_11df3ea432c3da480886b5033b3" UNIQUE ("entity_key")`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD "entity_key" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "entity_key" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "entity_key"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "entity_key"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "UQ_11df3ea432c3da480886b5033b3"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "entity_key"`);
    }

}
