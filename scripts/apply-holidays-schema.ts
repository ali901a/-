/**
 * يُنشئ جدول العطل الرسمية في قاعدة البيانات
 */
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "holidays" (
        "id" serial PRIMARY KEY,
        "date" timestamp NOT NULL,
        "name" varchar(200) NOT NULL,
        "isRecurringYearly" boolean NOT NULL DEFAULT false,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "holidays_date_unique"
      ON "holidays" (date_trunc('day', "date"));
    `);

    await client.query("COMMIT");
    console.log("✅ تم إنشاء جدول العطل الرسمية بنجاح");
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("❌ خطأ:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
