import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifyRequirementModuleRelation1777564000000 implements MigrationInterface {
    name = 'ModifyRequirementModuleRelation1777564000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. 给 feature_modules 表添加列
        await queryRunner.query(`ALTER TABLE "feature_modules" ADD COLUMN "aliases" jsonb`);
        await queryRunner.query(`ALTER TABLE "feature_modules" ADD COLUMN "keywords" jsonb`);
        await queryRunner.query(`ALTER TABLE "feature_modules" ADD COLUMN "path" text`);

        // 2. 创建关联表
        await queryRunner.query(`
            CREATE TABLE "requirement_modules" (
                "requirement_id" uuid NOT NULL,
                "module_id" uuid NOT NULL,
                CONSTRAINT "PK_requirement_modules" PRIMARY KEY ("requirement_id", "module_id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "idx_requirement_modules_requirement_id" ON "requirement_modules" ("requirement_id")`);
        await queryRunner.query(`CREATE INDEX "idx_requirement_modules_module_id" ON "requirement_modules" ("module_id")`);
        
        // 3. 添加外键约束
        await queryRunner.query(`
            ALTER TABLE "requirement_modules" 
            ADD CONSTRAINT "FK_requirement_modules_requirement" 
            FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "requirement_modules" 
            ADD CONSTRAINT "FK_requirement_modules_module" 
            FOREIGN KEY ("module_id") REFERENCES "feature_modules"("id") ON DELETE CASCADE
        `);

        // 4. 数据迁移：将现有的 module_id 关联迁移到关联表
        await queryRunner.query(`
            INSERT INTO "requirement_modules" ("requirement_id", "module_id")
            SELECT "id", "module_id" FROM "requirements" 
            WHERE "module_id" IS NOT NULL
        `);

        // 5. 数据迁移：将现有的 module_ids (simple-array) 解析并迁移
        // 注：simple-array 以逗号分隔存储，需要逐个解析
        const requirementsWithModuleIds = await queryRunner.query(`
            SELECT "id", "module_ids" FROM "requirements" 
            WHERE "module_ids" IS NOT NULL AND "module_ids" != ''
        `);
        
        for (const req of requirementsWithModuleIds) {
            const moduleIds = req.module_ids.split(',').filter((id: string) => id.trim() !== '');
            for (const moduleId of moduleIds) {
                // 检查是否已存在（避免与 module_id 重复）
                const exists = await queryRunner.query(`
                    SELECT 1 FROM "requirement_modules" 
                    WHERE "requirement_id" = $1 AND "module_id" = $2
                `, [req.id, moduleId.trim()]);
                
                if (exists.length === 0) {
                    await queryRunner.query(`
                        INSERT INTO "requirement_modules" ("requirement_id", "module_id")
                        VALUES ($1, $2)
                    `, [req.id, moduleId.trim()]);
                }
            }
        }

        // 6. 删除旧的外键约束
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_5081b0520428f213d7d4346a5cd"`);

        // 7. 删除旧字段
        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "module_id"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "module_ids"`);

        // 8. 计算并更新 path 字段
        const rootModules = await queryRunner.query(`
            SELECT "id", "name", "parent_id" FROM "feature_modules" WHERE "parent_id" IS NULL
        `);
        
        for (const root of rootModules) {
            await this.updatePathRecursively(queryRunner, root, root.name);
        }
    }

    private async updatePathRecursively(queryRunner: QueryRunner, module: any, currentPath: string): Promise<void> {
        // 更新当前模块的 path
        await queryRunner.query(`
            UPDATE "feature_modules" SET "path" = $1 WHERE "id" = $2
        `, [currentPath, module.id]);

        // 获取子模块
        const children = await queryRunner.query(`
            SELECT "id", "name" FROM "feature_modules" WHERE "parent_id" = $1
        `, [module.id]);

        for (const child of children) {
            const childPath = `${currentPath} / ${child.name}`;
            await this.updatePathRecursively(queryRunner, child, childPath);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. 恢复旧字段
        await queryRunner.query(`ALTER TABLE "requirements" ADD COLUMN "module_id" uuid`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD COLUMN "module_ids" text`);

        // 2. 从关联表恢复数据到旧字段
        await queryRunner.query(`
            UPDATE "requirements" r
            SET "module_id" = (
                SELECT "module_id" FROM "requirement_modules" rm 
                WHERE rm."requirement_id" = r."id" 
                LIMIT 1
            )
        `);

        // 3. 恢复外键约束
        await queryRunner.query(`
            ALTER TABLE "requirements" 
            ADD CONSTRAINT "FK_5081b0520428f213d7d4346a5cd" 
            FOREIGN KEY ("module_id") REFERENCES "feature_modules"("id") ON DELETE CASCADE
        `);

        // 4. 删除关联表
        await queryRunner.query(`ALTER TABLE "requirement_modules" DROP CONSTRAINT "FK_requirement_modules_module"`);
        await queryRunner.query(`ALTER TABLE "requirement_modules" DROP CONSTRAINT "FK_requirement_modules_requirement"`);
        await queryRunner.query(`DROP INDEX "idx_requirement_modules_module_id"`);
        await queryRunner.query(`DROP INDEX "idx_requirement_modules_requirement_id"`);
        await queryRunner.query(`DROP TABLE "requirement_modules"`);

        // 5. 删除新字段
        await queryRunner.query(`ALTER TABLE "feature_modules" DROP COLUMN "path"`);
        await queryRunner.query(`ALTER TABLE "feature_modules" DROP COLUMN "keywords"`);
        await queryRunner.query(`ALTER TABLE "feature_modules" DROP COLUMN "aliases"`);
    }
}
