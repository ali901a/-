/**
 * قدرات موديلات ZKTeco المختلفة
 * يُستخدم لضبط سلوك المحول حسب الموديل
 */

export interface ZKTecoModelCapabilities {
  /** اسم الموديل */
  name: string;
  /** حجم سجل الحضور بالبايت */
  attendanceRecordSize: number;
  /** حجم سجل الموظف بالبايت */
  userRecordSize: number;
  /** يدعم جلب سجلات بعد تاريخ معين */
  supportsIncrementalSync: boolean;
  /** يدعم مزامنة صور الموظفين */
  supportsPhotoSync: boolean;
  /** يدعم البصمة الكاملة */
  supportsFingerprint: boolean;
  /** يدعم التعرف على الوجه */
  supportsFaceRecognition: boolean;
  /** الوصف */
  description: string;
}

const MODELS: Record<string, ZKTecoModelCapabilities> = {
  // ============= سلسلة K =============
  "k14": {
    name: "ZKTeco K14",
    attendanceRecordSize: 40,
    userRecordSize: 72,
    supportsIncrementalSync: true,
    supportsPhotoSync: false,
    supportsFingerprint: true,
    supportsFaceRecognition: false,
    description: "جهاز بصمة أصابع اقتصادي",
  },
  "k20": {
    name: "ZKTeco K20",
    attendanceRecordSize: 40,
    userRecordSize: 72,
    supportsIncrementalSync: true,
    supportsPhotoSync: false,
    supportsFingerprint: true,
    supportsFaceRecognition: false,
    description: "جهاز بصمة أصابع متوسط",
  },
  "k40": {
    name: "ZKTeco K40",
    attendanceRecordSize: 40,
    userRecordSize: 72,
    supportsIncrementalSync: true,
    supportsPhotoSync: false,
    supportsFingerprint: true,
    supportsFaceRecognition: false,
    description: "جهاز بصمة أصابع متقدم",
  },

  // ============= سلسلة F =============
  "f18": {
    name: "ZKTeco F18",
    attendanceRecordSize: 40,
    userRecordSize: 72,
    supportsIncrementalSync: true,
    supportsPhotoSync: false,
    supportsFingerprint: true,
    supportsFaceRecognition: false,
    description: "جهاز بصمة أصابع F-Series",
  },
  "f22": {
    name: "ZKTeco F22",
    attendanceRecordSize: 40,
    userRecordSize: 72,
    supportsIncrementalSync: true,
    supportsPhotoSync: false,
    supportsFingerprint: true,
    supportsFaceRecognition: false,
    description: "جهاز بصمة مع بطاقة RFID",
  },

  // ============= سلسلة uFace =============
  "uface202": {
    name: "ZKTeco uFace202",
    attendanceRecordSize: 40,
    userRecordSize: 72,
    supportsIncrementalSync: true,
    supportsPhotoSync: true,
    supportsFingerprint: true,
    supportsFaceRecognition: true,
    description: "جهاز بصمة ووجه متقدم",
  },
  "uface800": {
    name: "ZKTeco uFace800",
    attendanceRecordSize: 40,
    userRecordSize: 72,
    supportsIncrementalSync: true,
    supportsPhotoSync: true,
    supportsFingerprint: true,
    supportsFaceRecognition: true,
    description: "جهاز بصمة ووجه عالي الأداء",
  },

  // ============= generic =============
  "generic": {
    name: "ZKTeco Generic",
    attendanceRecordSize: 40,
    userRecordSize: 72,
    supportsIncrementalSync: true,
    supportsPhotoSync: false,
    supportsFingerprint: true,
    supportsFaceRecognition: false,
    description: "موديل ZKTeco عام (متوافق مع معظم الأجهزة)",
  },
};

/** جلب قدرات موديل بعينه (يرجع 'generic' إذا لم يُعرف الموديل) */
export function getModelCapabilities(model: string): ZKTecoModelCapabilities {
  const key = model.toLowerCase().replace(/\s+/g, "");
  return MODELS[key] ?? MODELS["generic"]!;
}

/** قائمة جميع الموديلات المدعومة */
export function getSupportedModels(): string[] {
  return Object.keys(MODELS);
}
