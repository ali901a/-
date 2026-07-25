/**
 * يطبّق جداول طبقة تكامل الأجهزة مباشرة على قاعدة البيانات
 */
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ============= Enums =============
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE device_brand AS ENUM ('zkteco', 'other');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE device_protocol AS ENUM ('tcp', 'sdk', 'simulated');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE sync_status AS ENUM ('pending', 'running', 'success', 'failed', 'partial');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE sync_type AS ENUM ('full', 'incremental', 'employees_only', 'attendance_only');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ============= جدول الأجهزة =============
    await client.query(`
      CREATE TABLE IF NOT EXISTS "devices" (
        "id"                      SERIAL PRIMARY KEY,
        "deviceId"                VARCHAR(100),
        "name"                    VARCHAR(100) NOT NULL,
        "brand"                   device_brand NOT NULL DEFAULT 'zkteco',
        "model"                   VARCHAR(100) NOT NULL DEFAULT 'generic',
        "protocol"                device_protocol NOT NULL DEFAULT 'tcp',
        "ipAddress"               VARCHAR(45) NOT NULL,
        "port"                    INTEGER NOT NULL DEFAULT 4370,
        "timeoutSeconds"          INTEGER NOT NULL DEFAULT 10,
        "password"                VARCHAR(64),
        "location"                VARCHAR(200),
        "branch"                  VARCHAR(200),
        "notes"                   TEXT,
        "isActive"                BOOLEAN NOT NULL DEFAULT TRUE,
        "connectionStatus"        VARCHAR(20) NOT NULL DEFAULT 'unknown',
        "lastConnectionAt"        TIMESTAMP,
        "autoSyncEnabled"         BOOLEAN NOT NULL DEFAULT TRUE,
        "syncIntervalMinutes"     INTEGER NOT NULL DEFAULT 30,
        "lastSyncAt"              TIMESTAMP,
        "lastSyncStatus"          sync_status,
        "lastAttendanceTimestamp" TIMESTAMP,
        "createdAt"               TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt"               TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "deviceId" VARCHAR(100)`);
    await client.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "branch" VARCHAR(200)`);
    await client.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "connectionStatus" VARCHAR(20) NOT NULL DEFAULT 'unknown'`);
    await client.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "lastConnectionAt" TIMESTAMP`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "deviceConnectionErrors" (
        "id"          SERIAL PRIMARY KEY,
        "deviceId"    INTEGER NOT NULL,
        "operation"   VARCHAR(50) NOT NULL,
        "message"     TEXT NOT NULL,
        "stack"       TEXT,
        "occurredAt"  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // ============= جدول سجلات المزامنة =============
    await client.query(`
      CREATE TABLE IF NOT EXISTS "deviceSyncLogs" (
        "id"                 SERIAL PRIMARY KEY,
        "deviceId"           INTEGER NOT NULL,
        "syncType"           sync_type NOT NULL,
        "status"             sync_status NOT NULL,
        "employeesImported"  INTEGER NOT NULL DEFAULT 0,
        "attendanceImported" INTEGER NOT NULL DEFAULT 0,
        "duplicatesSkipped"  INTEGER NOT NULL DEFAULT 0,
        "errorMessage"       TEXT,
        "errorStack"         TEXT,
        "startedAt"          TIMESTAMP NOT NULL DEFAULT NOW(),
        "completedAt"        TIMESTAMP,
        "durationMs"         INTEGER
      );
    `);

    // ============= جدول ربط موظفي الأجهزة =============
    await client.query(`
      CREATE TABLE IF NOT EXISTS "deviceEmployeeMappings" (
        "id"             SERIAL PRIMARY KEY,
        "deviceId"       INTEGER NOT NULL,
        "deviceUserId"   VARCHAR(50) NOT NULL,
        "deviceUserName" VARCHAR(255),
        "employeeId"     INTEGER,
        "isActive"       BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt"      TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // ============= Indexes =============
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_deviceSyncLogs_deviceId"
        ON "deviceSyncLogs" ("deviceId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_deviceEmployeeMappings_deviceId"
        ON "deviceEmployeeMappings" ("deviceId");
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_deviceEmployeeMappings_unique"
        ON "deviceEmployeeMappings" ("deviceId", "deviceUserId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "idx_deviceConnectionErrors_deviceId"
        ON "deviceConnectionErrors" ("deviceId", "occurredAt");
    `);

    await client.query("COMMIT");
    console.log("✅ تم تطبيق جداول طبقة تكامل الأجهزة بنجاح");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ خطأ:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
