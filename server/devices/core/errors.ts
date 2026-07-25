/**
 * أنواع الأخطاء الخاصة بطبقة تكامل الأجهزة
 */

/** خطأ في الاتصال بالجهاز (لم يتم الوصول إليه) */
export class DeviceConnectionError extends Error {
  constructor(
    public readonly deviceName: string,
    public readonly ip: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(`[${deviceName}] خطأ في الاتصال بـ ${ip}: ${message}`);
    this.name = "DeviceConnectionError";
  }
}

/** خطأ في المصادقة (كلمة مرور خاطئة) */
export class DeviceAuthError extends Error {
  constructor(public readonly deviceName: string, message: string) {
    super(`[${deviceName}] فشل التحقق: ${message}`);
    this.name = "DeviceAuthError";
  }
}

/** خطأ في بروتوكول الاتصال (حزمة غير متوقعة) */
export class DeviceProtocolError extends Error {
  constructor(
    public readonly deviceName: string,
    message: string,
    public readonly rawData?: Buffer
  ) {
    super(`[${deviceName}] خطأ في البروتوكول: ${message}`);
    this.name = "DeviceProtocolError";
  }
}

/** انتهت مهلة العملية */
export class DeviceTimeoutError extends Error {
  constructor(
    public readonly deviceName: string,
    public readonly operationName: string,
    public readonly timeoutMs: number
  ) {
    super(
      `[${deviceName}] انتهت مهلة العملية "${operationName}" (${timeoutMs}ms)`
    );
    this.name = "DeviceTimeoutError";
  }
}

/** خطأ في عملية المزامنة */
export class DeviceSyncError extends Error {
  constructor(
    public readonly deviceId: number,
    message: string,
    public readonly cause?: unknown
  ) {
    super(`[Device #${deviceId}] خطأ في المزامنة: ${message}`);
    this.name = "DeviceSyncError";
  }
}

/** الجهاز غير متصل وتم محاولة إرسال أمر */
export class DeviceNotConnectedError extends Error {
  constructor(public readonly deviceName: string) {
    super(`[${deviceName}] الجهاز غير متصل`);
    this.name = "DeviceNotConnectedError";
  }
}

/** تحويل أي خطأ إلى رسالة نصية آمنة للتسجيل */
export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "خطأ غير معروف";
}

/** تحويل أي خطأ إلى stack trace نصي */
export function formatErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}
