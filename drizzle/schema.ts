import { 
  serial,
  pgEnum, 
  pgTable, 
  text, 
  timestamp, 
  varchar,
  numeric,
  boolean,
  integer
} from "drizzle-orm/pg-core";

// ============= Enums =============
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusEnum = pgEnum("status", ["active", "inactive"]);
export const recordTypeEnum = pgEnum("record_type", ["checkin", "checkout"]);
export const shiftStatusEnum = pgEnum("shift_status", ["incomplete", "complete"]);

/**
 * جدول المستخدمين - للمدراء والموظفين
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * جدول الموظفين - بيانات الموظفين الأساسية
 */
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeNumber: varchar("employeeNumber", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  department: varchar("department", { length: 100 }).notNull(),
  position: varchar("position", { length: 100 }),
  status: statusEnum("status").default("active").notNull(),
  hireDate: timestamp("hireDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * جدول السجلات - تسجيلات الحضور والانصراف
 * المنطق: أي تسجيل بعد منتصف الليل (00:00) يُربط بالوردية السابقة
 */
export const attendanceRecords = pgTable("attendanceRecords", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  // تاريخ الوردية (يوم بدء الوردية)
  shiftDate: timestamp("shiftDate").notNull(),
  // وقت التسجيل الفعلي
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  // نوع التسجيل: دخول أو خروج
  type: recordTypeEnum("type").notNull(),
  // ملاحظات إضافية (مثل سبب التأخر)
  notes: text("notes"),
  // هل تم التحقق من السجل يدوياً
  isManualEntry: boolean("isManualEntry").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;

/**
 * جدول الورديات - تجميع السجلات لكل وردية
 * يتم حساب ساعات العمل تلقائياً من الفرق بين الدخول والخروج
 */
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  // تاريخ بدء الوردية
  shiftDate: timestamp("shiftDate").notNull(),
  // وقت الدخول
  checkInTime: timestamp("checkInTime"),
  // وقت الخروج
  checkOutTime: timestamp("checkOutTime"),
  // ساعات العمل (بالساعات العشرية)
  workHours: numeric("workHours", { precision: 5, scale: 2 }),
  // حالة الوردية
  status: shiftStatusEnum("status").default("incomplete").notNull(),
  // ملاحظات
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

/**
 * جدول الإحصائيات اليومية - لتسريع عرض التقارير
 */
export const dailyStatistics = pgTable("dailyStatistics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalEmployees: integer("totalEmployees").notNull(),
  presentCount: integer("presentCount").notNull(),
  absentCount: integer("absentCount").notNull(),
  lateCount: integer("lateCount").notNull(),
  earlyLeaveCount: integer("earlyLeaveCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DailyStatistics = typeof dailyStatistics.$inferSelect;
export type InsertDailyStatistics = typeof dailyStatistics.$inferInsert;

/**
 * جدول سياسات الحضور - لتحديد أوقات العمل المتوقعة
 */
export const attendancePolicies = pgTable("attendancePolicies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  expectedWorkHours: numeric("expectedWorkHours", { precision: 5, scale: 2 }).notNull(),
  lateThresholdMinutes: integer("lateThresholdMinutes").default(15).notNull(),
  earlyLeaveThresholdMinutes: integer("earlyLeaveThresholdMinutes").default(15).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AttendancePolicy = typeof attendancePolicies.$inferSelect;
export type InsertAttendancePolicy = typeof attendancePolicies.$inferInsert;
