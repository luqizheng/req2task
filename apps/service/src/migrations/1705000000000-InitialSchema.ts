import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1705000000000 implements MigrationInterface {
  name = 'InitialSchema1705000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "migrations" ("id" SERIAL NOT NULL, "timestamp" bigint NOT NULL, "name" character NOT NULL, CONSTRAINT "PK_8f0f47dee01d1c81b7d15c0e659" PRIMARY KEY ("id"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "migrations"`);
  }
}
