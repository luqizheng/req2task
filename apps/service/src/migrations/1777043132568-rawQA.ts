import { MigrationInterface, QueryRunner } from "typeorm";

export class RawQA1777043132568 implements MigrationInterface {
    name = 'RawQA1777043132568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD "collect_time" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "collect_time"`);
    }

}
