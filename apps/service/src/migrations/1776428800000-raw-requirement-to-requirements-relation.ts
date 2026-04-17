import { MigrationInterface, QueryRunner } from "typeorm";

export class RawRequirementToRequirementsRelation1776428800000 implements MigrationInterface {
    name = 'RawRequirementToRequirementsRelation1776428800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "raw_requirements" 
            DROP COLUMN IF EXISTS "generated_requirement_id"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "requirements" 
            ADD COLUMN IF NOT EXISTS "raw_requirement_id" uuid
        `);
        
        await queryRunner.query(`
            ALTER TABLE "requirements" 
            ADD CONSTRAINT "FK_requirements_raw_requirement" 
            FOREIGN KEY ("raw_requirement_id") 
            REFERENCES "raw_requirements"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "requirements" 
            DROP CONSTRAINT IF EXISTS "FK_requirements_raw_requirement"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "requirements" 
            DROP COLUMN IF EXISTS "raw_requirement_id"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "raw_requirements" 
            ADD COLUMN "generated_requirement_id" uuid
        `);
    }
}
