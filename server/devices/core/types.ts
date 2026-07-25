/**
 * طبقة تكامل الأجهزة - Core Types
 * تعريف الواجهات والأنواع المشتركة لجميع محولات الأجهزة
 */

// ============= بيانات الجهاز من قاعدة البيانات =============

export interface DeviceConfig {
  id: number;
  name: string;
  brand: string;
  model: string;
  protocol: "tcp" | "sdk" | "simulated";
  ipAddress: string;
  port: number;
  timeoutSeconds: number;
  password?: string | null;
}

// ============= بيانات يعيدها الجهاز =============

/** بيانات موظف كما يعيدها الجهاز */
export interface DeviceEmployee {
  /** رقم المستخدم في الجهاز (قد يختلف عن رقم الموظف في النظام) */
  deviceUserId: string;
  /** الاسم كما هو مخزن في الجهاز */
  name: string;
  /** رقم البطاقة (اختياري) */
  cardNumber?: string;
  /** الدور: 0 = مستخدم عادي، 14 = مدير */
  role?: number;
}

/** سجل حضور واحد من الجهاز */
export interface DeviceAttendanceRecord {
  /** رقم المستخدم في الجهاز */
  deviceUserId: string;
  /** الوقت الفعلي للبصمة */
  recordedAt: Date;
  /**
   * نوع البصمة كما يعيده الجهاز:
   * 0 = دخول، 1 = خروج، 4 = دخول إضافي، 5 = خروج إضافي
   */
  inOutType: number;
  /** طريقة التحقق: 1 = بصمة، 3 = بطاقة، 15 = وجه */
  verifyType?: number;
}

/** معلومات الجهاز العامة */
export interface DeviceInfo {
  deviceName?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  platform?: string;
  macAddress?: string;
  totalUsers?: number;
  totalAttendance?: number;
}

// ============= نتائج عمليات الجهاز =============

/** نتيجة اختبار الاتصال */
export interface ConnectionTestResult {
  success: boolean;
  deviceInfo?: DeviceInfo;
  latencyMs?: number;
  error?: string;
}

/** نتيجة عملية مزامنة كاملة */
export interface SyncResult {
  success: boolean;
  employeesImported: number;
  attendanceImported: number;
  duplicatesSkipped: number;
  errors: string[];
  durationMs: number;
}

/** حالة الجهاز في الذاكرة */
export type DeviceStatus = "idle" | "connecting" | "connected" | "syncing" | "error" | "disconnected";

// ============= الواجهة الرئيسية للمحول =============

/**
 * IDeviceAdapter - الواجهة التي يجب أن ينفذها كل محول جهاز
 *
 * كل موديل أو بروتوكول جديد (ZKTeco، Suprema، HikVision...) ينفذ هذه الواجهة
 * دون أي تغيير في بقية النظام.
 */
export interface IDeviceAdapter {
  /** إنشاء الاتصال بالجهاز */
  connect(): Promise<void>;

  /** إغلاق الاتصال */
  disconnect(): Promise<void>;

  /** هل الاتصال نشط حالياً؟ */
  isConnected(): boolean;

  /** اختبار الاتصال وجلب معلومات الجهاز */
  testConnection(): Promise<ConnectionTestResult>;

  /** جلب قائمة الموظفين المخزنين في الجهاز */
  getEmployees(): Promise<DeviceEmployee[]>;

  /**
   * جلب سجلات الحضور والانصراف
   * @param since إن أُعطي، يجلب فقط السجلات بعد هذا التوقيت (للمزامنة التفاضلية)
   */
  getAttendanceLogs(since?: Date): Promise<DeviceAttendanceRecord[]>;

  /** جلب معلومات الجهاز (الموديل، الرقم التسلسلي...) */
  getDeviceInfo(): Promise<DeviceInfo>;
}

// ============= تسجيل المحولات =============

/** وصف محول مسجل في السجل */
export interface AdapterDescriptor {
  brand: string;
  /** موديلات مدعومة، '*' تعني جميع الموديلات */
  models: string[];
  protocol: string;
  description: string;
  factory: (config: DeviceConfig) => IDeviceAdapter;
}
