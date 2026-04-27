import { MigrationInterface, QueryRunner } from "typeorm";

export class AttrUpdate1777304769498 implements MigrationInterface {
    name = 'AttrUpdate1777304769498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_attachments" ADD "project_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7c02c61e27153a78244411756a" ON "project_attachments" ("project_id") `);
        await queryRunner.query(`ALTER TABLE "project_attachments" ADD CONSTRAINT "FK_7c02c61e27153a78244411756a2" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_attachments" DROP CONSTRAINT "FK_7c02c61e27153a78244411756a2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c02c61e27153a78244411756a"`);
        await queryRunner.query(`ALTER TABLE "project_attachments" DROP COLUMN "project_id"`);
    }

}
