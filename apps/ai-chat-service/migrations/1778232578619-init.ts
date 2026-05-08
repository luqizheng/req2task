import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1778232578619 implements MigrationInterface {
    name = 'Init1778232578619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
    }

}
