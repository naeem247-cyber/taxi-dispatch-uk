import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperationalReadinessIndexesAndSoftDelete1700000002000 implements MigrationInterface {
  name = 'OperationalReadinessIndexesAndSoftDelete1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_jobs_status" ON "jobs" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_jobs_assigned_driver" ON "jobs" ("assigned_driver_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_drivers_status" ON "drivers" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_drivers_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_jobs_assigned_driver"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_jobs_status"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "deleted_at"`);
  }
}
