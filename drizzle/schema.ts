import { 
  serial,
  pgEnum, 
  pgTable, 
  text, 
  timestamp, 
  varchar,
  numeric,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

// ============= Enums =============
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusEnum = pgEnum("status", ["active", "inactive"]);
export const recordTypeEnum = pgEnum("record_type", ["checkin", "checkout"]);
export const shiftStatusEnum = pgEnum("shift_status", ["incomplete", "complete", "absent"]);

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
 * جدول قوالب الورديات - تعريف أنواع الدوام
 * يدعم الورديات الليلية التي تبدأ في يوم وتنتهي في اليوم التالي
 */
export const shiftTemplates = pgTable("shiftTemplates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  // وقت بدء الوردية بصيغة "HH:MM" مثل "08:00" أو "22:00"
  startTime: varchar("startTime", { length: 5 }).notNull(),
  // وقت نهاية الوردية بصيغة "HH:MM"
  endTime: varchar("endTime", { length: 5 }).notNull(),
  // هل الوردية تمتد لليوم التالي (وردية ليلية)
  isOvernight: boolean("isOvernight").default(false).notNull(),
  // فترة السماح بالدقائق (يُضاف على وقت الدخول المقرر)
  gracePeriodMinutes: integer("gracePeriodMinutes").default(15).notNull(),
  // ساعات العمل المتوقعة
  expectedWorkHours: numeric("expectedWorkHours", { precision: 5, scale: 2 }).notNull(),
  // أيام العمل كمصفوفة JSON مثل [0,1,2,3,4] (0=الأحد، 6=السبت)
  workDays: text("workDays").notNull().default('[0,1,2,3,4]'),
  // ساعة نهاية اليوم الإداري (مثال: 4 يعني أن أي بصمة قبل 4:00 صباحاً تنتمي لليوم السابق)
  dayEndHour: integer("dayEndHour").default(0).notNull(),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ShiftTemplate = typeof shiftTemplates.$inferSelect;
export type InsertShiftTemplate = typeof shiftTemplates.$inferInsert;

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
 * جدول ربط الموظفين بالورديات
 */
export const employeeShiftAssignments = pgTable("employeeShiftAssignments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  shiftTemplateId: integer("shiftTemplateId").notNull(),
  // تاريخ بدء تطبيق الوردية
  effectiveFrom: timestamp("effectiveFrom").notNull(),
  // تاريخ انتهاء تطبيق الوردية (null = مستمر)
  effectiveTo: timestamp("effectiveTo"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmployeeShiftAssignment = typeof employeeShiftAssignments.$inferSelect;
export type InsertEmployeeShiftAssignment = typeof employeeShiftAssignments.$inferInsert;

/**
 * جدول السجلات الخام - كل بصمة على حدة
 */
export const attendanceRecords = pgTable("attendanceRecords", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  // اليوم الإداري (Business Day) الذي تنتمي إليه هذه البصمة
  shiftDate: timestamp("shiftDate").notNull(),
  // الوقت الفعلي للبصمة
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  type: recordTypeEnum("type").notNull(),
  notes: text("notes"),
  isManualEntry: boolean("isManualEntry").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;

/**
 * جدول الورديات المجمّعة - يوم عمل واحد لكل موظف
 * يحسب ساعات العمل والتأخير والخروج المبكر والإضافي تلقائياً
 */
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employeeId").notNull(),
  // اليوم الإداري
  shiftDate: timestamp("shiftDate").notNull(),
  // الوردية المرتبطة (من جدول القوالب)
  shiftTemplateId: integer("shiftTemplateId"),
  // وقت الدخول الفعلي
  checkInTime: timestamp("checkInTime"),
  // وقت الخروج الفعلي
  checkOutTime: timestamp("checkOutTime"),
  // ساعات العمل الفعلية
  workHours: numeric("workHours", { precision: 5, scale: 2 }),
  // دقائق التأخير (الدخول بعد الوقت المحدد + فترة السماح)
  lateMinutes: integer("lateMinutes").default(0).notNull(),
  // دقائق الخروج المبكر
  earlyLeaveMinutes: integer("earlyLeaveMinutes").default(0).notNull(),
  // دقائق الإضافي
  overtimeMinutes: integer("overtimeMinutes").default(0).notNull(),
  // دقائق النقص
  shortageMinutes: integer("shortageMinutes").default(0).notNull(),
  // حالة الوردية
  status: shiftStatusEnum("status").default("incomplete").notNull(),
  // هل تم تعديل هذا السجل يدوياً
  isManuallyEdited: boolean("isManuallyEdited").default(false).notNull(),
  editedBy: varchar("editedBy", { length: 255 }),
  editReason: text("editReason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

/**
 * سجل التعديلات اليدوية - audit trail لكل تعديل على وردية
 */
export const attendanceEditLog = pgTable("attendanceEditLog", {
  id: serial("id").primaryKey(),
  shiftId: integer("shiftId").notNull(),
  editedByName: varchar("editedByName", { length: 255 }),
  editReason: text("editReason").notNull(),
  // القيم السابقة
  previousCheckIn: timestamp("previousCheckIn"),
  previousCheckOut: timestamp("previousCheckOut"),
  previousStatus: varchar("previousStatus", { length: 50 }),
  // القيم الجديدة
  newCheckIn: timestamp("newCheckIn"),
  newCheckOut: timestamp("newCheckOut"),
  newStatus: varchar("newStatus", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttendanceEditLog = typeof attendanceEditLog.$inferSelect;
export type InsertAttendanceEditLog = typeof attendanceEditLog.$inferInsert;

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

// ============= Device Integration Layer =============

export const deviceBrandEnum = pgEnum("device_brand", ["zkteco", "other"]);
export const deviceProtocolEnum = pgEnum("device_protocol", ["tcp", "sdk", "simulated"]);
export const syncStatusEnum = pgEnum("sync_status", ["pending", "running", "success", "failed", "partial"]);
export const syncTypeEnum = pgEnum("sync_type", ["full", "incremental", "employees_only", "attendance_only"]);

/**
 * جدول الأجهزة - تكوين كل جهاز بصمة متصل بالنظام
 */
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  deviceId: varchar("deviceId", { length: 100 }),
  name: varchar("name", { length: 100 }).notNull(),
  brand: deviceBrandEnum("brand").notNull().default("zkteco"),
  model: varchar("model", { length: 100 }).notNull().default("generic"),
  protocol: deviceProtocolEnum("protocol").notNull().default("tcp"),
  // إعدادات الشبكة
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  port: integer("port").notNull().default(4370),
  timeoutSeconds: integer("timeoutSeconds").notNull().default(10),
  // المصادقة (اختياري لبعض الموديلات)
  password: varchar("password", { length: 64 }),
  // موقع الجهاز ووصفه
  location: varchar("location", { length: 200 }),
  branch: varchar("branch", { length: 200 }),
  notes: text("notes"),
  // الحالة والتزامن التلقائي
  isActive: boolean("isActive").default(true).notNull(),
  connectionStatus: varchar("connectionStatus", { length: 20 }).default("unknown").notNull(),
  lastConnectionAt: timestamp("lastConnectionAt"),
  autoSyncEnabled: boolean("autoSyncEnabled").default(true).notNull(),
  syncIntervalMinutes: integer("syncIntervalMinutes").default(30).notNull(),
  // آخر مزامنة ناجحة
  lastSyncAt: timestamp("lastSyncAt"),
  lastSyncStatus: syncStatusEnum("lastSyncStatus"),
  // تتبع البيانات المستوردة لمنع التكرار
  lastAttendanceTimestamp: timestamp("lastAttendanceTimestamp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * سجل أخطاء الاتصال - يحتفظ بآخر أسباب فشل الوصول إلى الأجهزة
 */
export const deviceConnectionErrors = pgTable("deviceConnectionErrors", {
  id: serial("id").primaryKey(),
  deviceId: integer("deviceId").notNull(),
  operation: varchar("operation", { length: 50 }).notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export type DeviceConnectionError = typeof deviceConnectionErrors.$inferSelect;
export type InsertDeviceConnectionError = typeof deviceConnectionErrors.$inferInsert;

/**
 * جدول سجلات المزامنة - تتبع كل عملية مزامنة مع الجهاز
 */
export const deviceSyncLogs = pgTable("deviceSyncLogs", {
  id: serial("id").primaryKey(),
  deviceId: integer("deviceId").notNull(),
  syncType: syncTypeEnum("syncType").notNull(),
  status: syncStatusEnum("status").notNull(),
  // إحصائيات العملية
  employeesImported: integer("employeesImported").default(0).notNull(),
  attendanceImported: integer("attendanceImported").default(0).notNull(),
  duplicatesSkipped: integer("duplicatesSkipped").default(0).notNull(),
  // تفاصيل الخطأ إن وجد
  errorMessage: text("errorMessage"),
  errorStack: text("errorStack"),
  // توقيت العملية
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  durationMs: integer("durationMs"),
});

export type DeviceSyncLog = typeof deviceSyncLogs.$inferSelect;
export type InsertDeviceSyncLog = typeof deviceSyncLogs.$inferInsert;

/**
 * جدول ربط موظفي الجهاز بموظفي النظام
 * يسمح بمزامنة الموظفين حتى لو اختلفت أرقامهم بين الجهاز والنظام
 */
export const deviceEmployeeMappings = pgTable("deviceEmployeeMappings", {
  id: serial("id").primaryKey(),
  deviceId: integer("deviceId").notNull(),
  // رقم المستخدم في الجهاز
  deviceUserId: varchar("deviceUserId", { length: 50 }).notNull(),
  // اسم المستخدم كما في الجهاز
  deviceUserName: varchar("deviceUserName", { length: 255 }),
  // الموظف المقابل في النظام (null = لم يُربط بعد)
  employeeId: integer("employeeId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DeviceEmployeeMapping = typeof deviceEmployeeMappings.$inferSelect;
export type InsertDeviceEmployeeMapping = typeof deviceEmployeeMappings.$inferInsert;

// ============= العطل الرسمية =============

/**
 * جدول العطل الرسمية - تواريخ محددة خارج نطاق اليوم الإداري
 */
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  // تاريخ العطلة (يُخزّن كـ midnight لليوم)
  date: timestamp("date").notNull().unique(),
  // اسم أو وصف العطلة
  name: varchar("name", { length: 200 }).notNull(),
  // هل تتكرر سنوياً (مثل العطل الوطنية)
  isRecurringYearly: boolean("isRecurringYearly").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = typeof holidays.$inferInsert;
