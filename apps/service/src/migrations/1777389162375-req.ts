import { MigrationInterface, QueryRunner } from "typeorm";

export class Req1777389162375 implements MigrationInterface {
    name = 'Req1777389162375'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requirements" ADD "key_elements" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "key_elements"`);
    }

}
