import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TYPE "public"."accounts_role_enum" AS ENUM('admin', 'operator', 'driver')`);
    await queryRunner.query(`CREATE TYPE "public"."jobs_status_enum" AS ENUM('requested', 'accepted', 'arrived', 'on_trip', 'completed')`);

    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "public"."accounts_role_enum" NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_accounts_email" UNIQUE ("email"),
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "plate" character varying NOT NULL,
        "make" character varying NOT NULL,
        "model" character varying NOT NULL,
        "capacity" integer NOT NULL DEFAULT 4,
        "private_hire_licence_no" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_vehicles_plate" UNIQUE ("plate"),
        CONSTRAINT "UQ_vehicles_licence" UNIQUE ("private_hire_licence_no"),
        CONSTRAINT "PK_vehicles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "drivers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "account_id" uuid NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "phone_number" character varying NOT NULL,
        "available" boolean NOT NULL DEFAULT true,
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "last_gps_at" TIMESTAMP WITH TIME ZONE,
        "vehicle_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_drivers_account_id" UNIQUE ("account_id"),
        CONSTRAINT "UQ_drivers_phone" UNIQUE ("phone_number"),
        CONSTRAINT "PK_drivers_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "full_name" character varying NOT NULL,
        "phone_number" character varying NOT NULL,
        "email" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_customers_phone" UNIQUE ("phone_number"),
        CONSTRAINT "PK_customers_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "customer_id" uuid NOT NULL,
        "pickup_address" character varying NOT NULL,
        "dropoff_address" character varying NOT NULL,
        "pickup_latitude" numeric(10,7),
        "pickup_longitude" numeric(10,7),
        "scheduled_for" TIMESTAMP WITH TIME ZONE,
        "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'requested',
        "assigned_driver_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jobs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "recurring_jobs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "customer_id" uuid NOT NULL,
        "pickup_address" character varying NOT NULL,
        "dropoff_address" character varying NOT NULL,
        "cron_expression" character varying NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recurring_jobs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "drivers" ADD CONSTRAINT "FK_drivers_account" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "drivers" ADD CONSTRAINT "FK_drivers_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_driver" FOREIGN KEY ("assigned_driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "recurring_jobs" ADD CONSTRAINT "FK_recurring_jobs_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    await queryRunner.query(`CREATE INDEX "IDX_jobs_status" ON "jobs" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_assigned_driver" ON "jobs" ("assigned_driver_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_drivers_available" ON "drivers" ("available")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_drivers_available"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_assigned_driver"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_status"`);

    await queryRunner.query(`ALTER TABLE "recurring_jobs" DROP CONSTRAINT "FK_recurring_jobs_customer"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_driver"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_customer"`);
    await queryRunner.query(`ALTER TABLE "drivers" DROP CONSTRAINT "FK_drivers_vehicle"`);
    await queryRunner.query(`ALTER TABLE "drivers" DROP CONSTRAINT "FK_drivers_account"`);

    await queryRunner.query(`DROP TABLE "recurring_jobs"`);
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TABLE "drivers"`);
    await queryRunner.query(`DROP TABLE "vehicles"`);
    await queryRunner.query(`DROP TABLE "accounts"`);

    await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."accounts_role_enum"`);
  }
}
