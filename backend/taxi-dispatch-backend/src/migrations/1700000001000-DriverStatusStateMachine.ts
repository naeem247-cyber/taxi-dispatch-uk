import { MigrationInterface, QueryRunner } from 'typeorm';

export class DriverStatusStateMachine1700000001000 implements MigrationInterface {
  name = 'DriverStatusStateMachine1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."drivers_status_enum" AS ENUM('offline', 'available', 'reserved', 'on_trip')`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" ADD COLUMN "status" "public"."drivers_status_enum" NOT NULL DEFAULT 'offline'`,
    );
    await queryRunner.query(
      `UPDATE "drivers" SET "status" = CASE WHEN "available" = true THEN 'available'::"public"."drivers_status_enum" ELSE 'offline'::"public"."drivers_status_enum" END`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_drivers_status" ON "drivers" ("status")`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_drivers_available"`);
    await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN "available"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drivers" ADD COLUMN "available" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(
      `UPDATE "drivers" SET "available" = CASE WHEN "status" = 'available'::"public"."drivers_status_enum" THEN true ELSE false END`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_drivers_status"`);
    await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN "status"`);
    await queryRunner.query(`CREATE INDEX "IDX_drivers_available" ON "drivers" ("available")`);
    await queryRunner.query(`DROP TYPE "public"."drivers_status_enum"`);
  }
}
