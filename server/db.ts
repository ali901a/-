import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { 
  InsertUser, 
  users,
  employees,
  attendanceRecords,
  shifts,
  dailyStatistics,
  attendancePolicies,
  type Employee,
  type AttendanceRecord,
  type Shift,
  type InsertEmployee,
  type InsertAttendanceRecord,
  type InsertShift,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= المستخدمون =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= الموظفون =============

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(employees).values(data);
  return result;
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(employees).set({ ...data, updatedAt: new Date() }).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(employees).where(eq(employees.id, id));
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEmployeeByNumber(employeeNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(employees).where(eq(employees.employeeNumber, employeeNumber)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllEmployees() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(employees).orderBy(desc(employees.createdAt));
}

// ============= سجلات الحضور =============

export async function createAttendanceRecord(data: InsertAttendanceRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(attendanceRecords).values(data).returning();
  return result[0];
}

export async function getAttendanceRecords(filters: {
  employeeId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters.employeeId !== undefined) {
    conditions.push(eq(attendanceRecords.employeeId, filters.employeeId));
  }
  if (filters.startDate) {
    conditions.push(gte(attendanceRecords.shiftDate, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(attendanceRecords.shiftDate, filters.endDate));
  }

  const query = db.select().from(attendanceRecords);

  if (conditions.length > 0) {
    return await query.where(and(...conditions)).orderBy(desc(attendanceRecords.recordedAt));
  }

  return await query.orderBy(desc(attendanceRecords.recordedAt));
}

export async function getLastAttendanceRecord(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.employeeId, employeeId))
    .orderBy(desc(attendanceRecords.recordedAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ============= الورديات =============

export async function getOrCreateShift(employeeId: number, shiftDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Normalize date to start of day
  const dateStart = new Date(shiftDate);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(shiftDate);
  dateEnd.setHours(23, 59, 59, 999);

  const existing = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.employeeId, employeeId),
        gte(shifts.shiftDate, dateStart),
        lte(shifts.shiftDate, dateEnd)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db
    .insert(shifts)
    .values({
      employeeId,
      shiftDate: dateStart,
      status: "incomplete",
    })
    .returning();

  return result[0];
}

export async function updateShift(id: number, data: Partial<InsertShift>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(shifts).set({ ...data, updatedAt: new Date() }).where(eq(shifts.id, id));
}

export async function getShifts(filters: {
  employeeId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters.employeeId !== undefined) {
    conditions.push(eq(shifts.employeeId, filters.employeeId));
  }
  if (filters.startDate) {
    conditions.push(gte(shifts.shiftDate, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(shifts.shiftDate, filters.endDate));
  }

  const query = db.select().from(shifts);

  if (conditions.length > 0) {
    return await query.where(and(...conditions)).orderBy(desc(shifts.shiftDate));
  }

  return await query.orderBy(desc(shifts.shiftDate));
}

export async function getTodayShifts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await db
    .select()
    .from(shifts)
    .where(and(gte(shifts.shiftDate, today), lte(shifts.shiftDate, tomorrow)))
    .orderBy(desc(shifts.shiftDate));
}

// ============= الإحصائيات =============

export async function getEmployeeCount() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees)
    .where(eq(employees.status, "active"));

  return result[0]?.count ?? 0;
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalResult, todayShifts, activeEmployees] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(employees).where(eq(employees.status, "active")),
    db.select().from(shifts).where(and(gte(shifts.shiftDate, today), lte(shifts.shiftDate, tomorrow))),
    db.select({ count: sql<number>`count(*)::int` }).from(employees).where(eq(employees.status, "active")),
  ]);

  const totalEmployees = totalResult[0]?.count ?? 0;
  const presentCount = todayShifts.filter(s => s.checkInTime !== null).length;
  const completedCount = todayShifts.filter(s => s.status === "complete").length;

  return {
    totalEmployees,
    presentCount,
    completedCount,
    absentCount: totalEmployees - presentCount,
  };
}
