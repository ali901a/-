import { eq, and, gte, lte, desc, sql, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { 
  InsertUser, 
  users,
  employees,
  attendanceRecords,
  shifts,
  shiftTemplates,
  employeeShiftAssignments,
  attendanceEditLog,
  dailyStatistics,
  type Employee,
  type AttendanceRecord,
  type Shift,
  type ShiftTemplate,
  type EmployeeShiftAssignment,
  type AttendanceEditLog,
  type InsertEmployee,
  type InsertAttendanceRecord,
  type InsertShift,
  type InsertShiftTemplate,
  type InsertEmployeeShiftAssignment,
  type InsertAttendanceEditLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ============= Business Day Logic =============

/**
 * احسب اليوم الإداري (Business Day) لوقت معين.
 * إذا كان dayEndHour > 0 وكان الوقت قبل تلك الساعة، فهذا التسجيل ينتمي لليوم السابق.
 * مثال: dayEndHour=4 → أي وقت بين 00:00 و 03:59 ينتمي لليوم السابق.
 */
export function getBusinessDay(timestamp: Date, dayEndHour: number = 0): Date {
  const d = new Date(timestamp);
  if (dayEndHour > 0 && d.getHours() < dayEndHour) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * حوّل نص الوقت "HH:MM" إلى { hours, minutes }
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(':');
  return { hours: parseInt(parts[0] ?? '0', 10), minutes: parseInt(parts[1] ?? '0', 10) };
}

/**
 * احسب مقاييس الوردية (التأخير، الخروج المبكر، الإضافي، النقص)
 */
export function calculateShiftMetrics(
  checkIn: Date,
  checkOut: Date,
  businessDay: Date,
  template: ShiftTemplate
): {
  workHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  shortageMinutes: number;
} {
  const start = parseTime(template.startTime);
  const end = parseTime(template.endTime);

  // وقت البدء المقرر
  const scheduledStart = new Date(businessDay);
  scheduledStart.setHours(start.hours, start.minutes, 0, 0);

  // وقت النهاية المقررة
  const scheduledEnd = new Date(businessDay);
  scheduledEnd.setHours(end.hours, end.minutes, 0, 0);
  if (template.isOvernight) {
    scheduledEnd.setDate(scheduledEnd.getDate() + 1);
  }

  // ساعات العمل الفعلية
  const workMs = checkOut.getTime() - checkIn.getTime();
  const workHours = Math.max(0, workMs / (1000 * 60 * 60));

  // دقائق التأخير (الدخول بعد الوقت + فترة السماح)
  const lateMs = checkIn.getTime() - scheduledStart.getTime() - (template.gracePeriodMinutes * 60 * 1000);
  const lateMinutes = Math.max(0, Math.floor(lateMs / (1000 * 60)));

  // دقائق الخروج المبكر
  const earlyMs = scheduledEnd.getTime() - checkOut.getTime();
  const earlyLeaveMinutes = Math.max(0, Math.floor(earlyMs / (1000 * 60)));

  // ساعات العمل المتوقعة
  const expectedWorkHours = parseFloat(template.expectedWorkHours.toString());

  // الإضافي والنقص
  const diffMinutes = Math.round((workHours - expectedWorkHours) * 60);
  const overtimeMinutes = Math.max(0, diffMinutes);
  const shortageMinutes = Math.max(0, -diffMinutes);

  return { workHours, lateMinutes, earlyLeaveMinutes, overtimeMinutes, shortageMinutes };
}

// ============= المستخدمون =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= قوالب الورديات =============

export async function createShiftTemplate(data: InsertShiftTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(shiftTemplates).values(data).returning();
  return result[0];
}

export async function updateShiftTemplate(id: number, data: Partial<InsertShiftTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(shiftTemplates).set({ ...data, updatedAt: new Date() }).where(eq(shiftTemplates.id, id)).returning();
  return result[0];
}

export async function deleteShiftTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(shiftTemplates).where(eq(shiftTemplates.id, id));
}

export async function getShiftTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(shiftTemplates).where(eq(shiftTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllShiftTemplates() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(shiftTemplates).orderBy(shiftTemplates.name);
}

// ============= ربط الموظفين بالورديات =============

export async function assignEmployeeToShift(data: InsertEmployeeShiftAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // أوقف أي تعيين نشط آخر لنفس الموظف
  await db.update(employeeShiftAssignments)
    .set({ isActive: false, effectiveTo: data.effectiveFrom, updatedAt: new Date() })
    .where(and(
      eq(employeeShiftAssignments.employeeId, data.employeeId),
      eq(employeeShiftAssignments.isActive, true),
    ));
  const result = await db.insert(employeeShiftAssignments).values(data).returning();
  return result[0];
}

export async function updateAssignment(id: number, data: Partial<InsertEmployeeShiftAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(employeeShiftAssignments).set({ ...data, updatedAt: new Date() }).where(eq(employeeShiftAssignments.id, id)).returning();
  return result[0];
}

export async function removeAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(employeeShiftAssignments).where(eq(employeeShiftAssignments.id, id));
}

export async function getEmployeeActiveAssignment(employeeId: number, atDate: Date = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(employeeShiftAssignments)
    .where(and(
      eq(employeeShiftAssignments.employeeId, employeeId),
      eq(employeeShiftAssignments.isActive, true),
      lte(employeeShiftAssignments.effectiveFrom, atDate),
      or(isNull(employeeShiftAssignments.effectiveTo), gte(employeeShiftAssignments.effectiveTo, atDate))
    ))
    .orderBy(desc(employeeShiftAssignments.effectiveFrom))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEmployeeAssignments(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(employeeShiftAssignments)
    .where(eq(employeeShiftAssignments.employeeId, employeeId))
    .orderBy(desc(employeeShiftAssignments.effectiveFrom));
}

export async function getAllAssignments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(employeeShiftAssignments).orderBy(desc(employeeShiftAssignments.createdAt));
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

// ============= سجلات الحضور الخام =============

export async function createAttendanceRecord(data: InsertAttendanceRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(attendanceRecords).values(data).returning();
  return result[0];
}

export async function getAttendanceRecords(
  employeeId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(attendanceRecords.employeeId, employeeId)];
  if (startDate) conditions.push(gte(attendanceRecords.shiftDate, startDate));
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(attendanceRecords.shiftDate, end));
  }
  return await db.select().from(attendanceRecords)
    .where(and(...conditions))
    .orderBy(desc(attendanceRecords.recordedAt));
}

export async function getLastAttendanceRecord(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(attendanceRecords)
    .where(eq(attendanceRecords.employeeId, employeeId))
    .orderBy(desc(attendanceRecords.recordedAt))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getRecentAttendanceRecords(limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select({
    id: attendanceRecords.id,
    employeeId: attendanceRecords.employeeId,
    shiftDate: attendanceRecords.shiftDate,
    recordedAt: attendanceRecords.recordedAt,
    type: attendanceRecords.type,
    notes: attendanceRecords.notes,
    isManualEntry: attendanceRecords.isManualEntry,
    employeeName: employees.name,
    department: employees.department,
    employeeNumber: employees.employeeNumber,
  })
  .from(attendanceRecords)
  .leftJoin(employees, eq(attendanceRecords.employeeId, employees.id))
  .orderBy(desc(attendanceRecords.recordedAt))
  .limit(limit);
}

// ============= تسجيل الحضور والانصراف الذكي =============

/**
 * سجّل بصمة للموظف مع احترام اليوم الإداري والورديات الليلية.
 */
export async function recordAttendance(
  employeeId: number,
  overrideType?: 'checkin' | 'checkout',
  isManualEntry: boolean = false,
  notes?: string,
  recordedAt: Date = new Date()
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // حدد الوردية النشطة للموظف (إن وجدت)
  const assignment = await getEmployeeActiveAssignment(employeeId, recordedAt);
  let template: ShiftTemplate | null = null;
  if (assignment) {
    template = await getShiftTemplateById(assignment.shiftTemplateId);
  }

  // احسب اليوم الإداري
  const dayEndHour = template?.dayEndHour ?? 0;
  const businessDay = getBusinessDay(recordedAt, dayEndHour);

  // حدد نوع التسجيل (دخول/خروج) بناءً على آخر سجل
  let recordType: 'checkin' | 'checkout';
  if (overrideType) {
    recordType = overrideType;
  } else {
    const lastRecord = await getLastAttendanceRecord(employeeId);
    recordType = (!lastRecord || lastRecord.type === 'checkout') ? 'checkin' : 'checkout';
  }

  // أنشئ سجل البصمة
  const record = await createAttendanceRecord({
    employeeId,
    shiftDate: businessDay,
    recordedAt,
    type: recordType,
    notes,
    isManualEntry,
  });

  // احصل أو أنشئ الوردية اليومية
  const shift = await getOrCreateShift(employeeId, businessDay, template?.id);

  if (recordType === 'checkin') {
    // سجّل وقت الدخول
    if (!shift.checkInTime) {
      await updateShift(shift.id, {
        checkInTime: recordedAt,
        shiftTemplateId: template?.id ?? undefined,
        status: 'incomplete',
      });
    }
  } else {
    // سجّل وقت الخروج وأكمل الوردية
    const checkIn = shift.checkInTime ?? recordedAt;
    let metrics = { workHours: 0, lateMinutes: 0, earlyLeaveMinutes: 0, overtimeMinutes: 0, shortageMinutes: 0 };
    if (template) {
      metrics = calculateShiftMetrics(checkIn, recordedAt, businessDay, template);
    } else {
      const workMs = recordedAt.getTime() - checkIn.getTime();
      metrics.workHours = Math.max(0, workMs / (1000 * 60 * 60));
    }
    await updateShift(shift.id, {
      checkOutTime: recordedAt,
      workHours: metrics.workHours.toFixed(2) as any,
      lateMinutes: metrics.lateMinutes,
      earlyLeaveMinutes: metrics.earlyLeaveMinutes,
      overtimeMinutes: metrics.overtimeMinutes,
      shortageMinutes: metrics.shortageMinutes,
      status: 'complete',
    });
  }

  return { record, type: recordType };
}

// ============= الورديات =============

export async function getOrCreateShift(employeeId: number, businessDay: Date, shiftTemplateId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dateStart = new Date(businessDay);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(businessDay);
  dateEnd.setHours(23, 59, 59, 999);

  const existing = await db.select().from(shifts)
    .where(and(
      eq(shifts.employeeId, employeeId),
      gte(shifts.shiftDate, dateStart),
      lte(shifts.shiftDate, dateEnd),
    ))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const result = await db.insert(shifts).values({
    employeeId,
    shiftDate: dateStart,
    shiftTemplateId: shiftTemplateId ?? undefined,
    status: 'incomplete',
  }).returning();
  return result[0];
}

export async function updateShift(id: number, data: Partial<InsertShift>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(shifts).set({ ...data, updatedAt: new Date() }).where(eq(shifts.id, id)).returning();
  return result[0];
}

export async function getShiftById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEmployeeShifts(employeeId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(shifts.employeeId, employeeId)];
  if (startDate) conditions.push(gte(shifts.shiftDate, startDate));
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(shifts.shiftDate, end));
  }
  return await db.select().from(shifts)
    .where(and(...conditions))
    .orderBy(desc(shifts.shiftDate));
}

export async function getAllShifts(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [];
  if (startDate) conditions.push(gte(shifts.shiftDate, startDate));
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(shifts.shiftDate, end));
  }
  const query = db.select({
    id: shifts.id,
    employeeId: shifts.employeeId,
    shiftDate: shifts.shiftDate,
    shiftTemplateId: shifts.shiftTemplateId,
    checkInTime: shifts.checkInTime,
    checkOutTime: shifts.checkOutTime,
    workHours: shifts.workHours,
    lateMinutes: shifts.lateMinutes,
    earlyLeaveMinutes: shifts.earlyLeaveMinutes,
    overtimeMinutes: shifts.overtimeMinutes,
    shortageMinutes: shifts.shortageMinutes,
    status: shifts.status,
    isManuallyEdited: shifts.isManuallyEdited,
    editedBy: shifts.editedBy,
    editReason: shifts.editReason,
    notes: shifts.notes,
    createdAt: shifts.createdAt,
    updatedAt: shifts.updatedAt,
    employeeName: employees.name,
    department: employees.department,
    employeeNumber: employees.employeeNumber,
    shiftTemplateName: shiftTemplates.name,
  })
  .from(shifts)
  .leftJoin(employees, eq(shifts.employeeId, employees.id))
  .leftJoin(shiftTemplates, eq(shifts.shiftTemplateId, shiftTemplates.id));

  if (conditions.length > 0) {
    return await query.where(and(...conditions)).orderBy(desc(shifts.shiftDate));
  }
  return await query.orderBy(desc(shifts.shiftDate));
}

// ============= التعديل اليدوي =============

export async function manuallyEditShift(
  shiftId: number,
  newCheckIn: Date | null,
  newCheckOut: Date | null,
  editReason: string,
  editedByName: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const shift = await getShiftById(shiftId);
  if (!shift) throw new Error("Shift not found");

  // سجّل في audit log
  await db.insert(attendanceEditLog).values({
    shiftId,
    editedByName,
    editReason,
    previousCheckIn: shift.checkInTime,
    previousCheckOut: shift.checkOutTime,
    previousStatus: shift.status,
    newCheckIn,
    newCheckOut,
    newStatus: newCheckIn && newCheckOut ? 'complete' : 'incomplete',
  });

  // احسب المقاييس الجديدة
  let metrics = { workHours: 0, lateMinutes: 0, earlyLeaveMinutes: 0, overtimeMinutes: 0, shortageMinutes: 0 };
  if (newCheckIn && newCheckOut && shift.shiftTemplateId) {
    const template = await getShiftTemplateById(shift.shiftTemplateId);
    if (template) {
      metrics = calculateShiftMetrics(newCheckIn, newCheckOut, new Date(shift.shiftDate), template);
    } else {
      const workMs = newCheckOut.getTime() - newCheckIn.getTime();
      metrics.workHours = Math.max(0, workMs / (1000 * 60 * 60));
    }
  } else if (newCheckIn && newCheckOut) {
    const workMs = newCheckOut.getTime() - newCheckIn.getTime();
    metrics.workHours = Math.max(0, workMs / (1000 * 60 * 60));
  }

  const newStatus = newCheckIn && newCheckOut ? 'complete' : 'incomplete';

  return await updateShift(shiftId, {
    checkInTime: newCheckIn ?? undefined,
    checkOutTime: newCheckOut ?? undefined,
    workHours: newCheckIn && newCheckOut ? (metrics.workHours.toFixed(2) as any) : undefined,
    lateMinutes: metrics.lateMinutes,
    earlyLeaveMinutes: metrics.earlyLeaveMinutes,
    overtimeMinutes: metrics.overtimeMinutes,
    shortageMinutes: metrics.shortageMinutes,
    status: newStatus as any,
    isManuallyEdited: true,
    editedBy: editedByName,
    editReason,
  });
}

export async function getShiftEditLog(shiftId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(attendanceEditLog)
    .where(eq(attendanceEditLog.shiftId, shiftId))
    .orderBy(desc(attendanceEditLog.createdAt));
}

// ============= الإحصائيات =============

export async function getEmployeeCount() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({ count: sql<number>`count(*)::int` })
    .from(employees).where(eq(employees.status, 'active'));
  return result[0]?.count ?? 0;
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalResult, todayShifts] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(employees).where(eq(employees.status, 'active')),
    db.select().from(shifts).where(and(gte(shifts.shiftDate, today), lte(shifts.shiftDate, tomorrow))),
  ]);

  const totalEmployees = totalResult[0]?.count ?? 0;
  const presentCount = todayShifts.filter(s => s.checkInTime !== null).length;
  const lateCount = todayShifts.filter(s => (s.lateMinutes ?? 0) > 0).length;
  const completedCount = todayShifts.filter(s => s.status === 'complete').length;

  return {
    totalEmployees,
    presentCount,
    completedCount,
    lateCount,
    absentCount: Math.max(0, totalEmployees - presentCount),
  };
}

export async function calculateDailyStatistics(date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [totalResult, dayShifts] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(employees).where(eq(employees.status, 'active')),
    db.select().from(shifts).where(and(gte(shifts.shiftDate, dayStart), lte(shifts.shiftDate, dayEnd))),
  ]);

  const totalEmployees = totalResult[0]?.count ?? 0;
  const presentCount = dayShifts.filter(s => s.checkInTime !== null).length;
  const lateCount = dayShifts.filter(s => (s.lateMinutes ?? 0) > 0).length;
  const earlyLeaveCount = dayShifts.filter(s => (s.earlyLeaveMinutes ?? 0) > 0).length;
  const absentCount = Math.max(0, totalEmployees - presentCount);

  return {
    totalEmployees,
    presentCount,
    absentCount,
    lateCount,
    earlyLeaveCount,
    completedCount: dayShifts.filter(s => s.status === 'complete').length,
    overtimeCount: dayShifts.filter(s => (s.overtimeMinutes ?? 0) > 0).length,
    totalWorkHours: dayShifts.reduce((sum, s) => sum + parseFloat(s.workHours?.toString() ?? '0'), 0),
  };
}
