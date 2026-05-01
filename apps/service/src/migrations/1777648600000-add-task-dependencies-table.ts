import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskDependenciesTable1777648600000 implements MigrationInterface {
  name = 'AddTaskDependenciesTable1777648600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tasks_dependencies" (
        "task_id" uuid NOT NULL,
        "dependency_id" uuid NOT NULL,
        CONSTRAINT "PK_tasks_dependencies" PRIMARY KEY ("task_id", "dependency_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_dependencies_task_id" ON "tasks_dependencies" ("task_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tasks_dependencies_dependency_id" ON "tasks_dependencies" ("dependency_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks_dependencies" ADD CONSTRAINT "FK_tasks_dependencies_task_id"
      FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks_dependencies" ADD CONSTRAINT "FK_tasks_dependencies_dependency_id"
      FOREIGN KEY ("dependency_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks_dependencies" DROP CONSTRAINT "FK_tasks_dependencies_dependency_id"`);
    await queryRunner.query(`ALTER TABLE "tasks_dependencies" DROP CONSTRAINT "FK_tasks_dependencies_task_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tasks_dependencies_dependency_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tasks_dependencies_task_id"`);
    await queryRunner.query(`DROP TABLE "tasks_dependencies"`);
  }
}
