/**
 * خدمة المزامنة التلقائية
 *
 * تُنظّم عمليات مزامنة الأجهزة:
 * - مزامنة دورية تلقائية حسب إعداد كل جهاز
 * - مزامنة يدوية فورية
 * - منع التكرار في سجلات الحضور
 * - تسجيل جميع الأخطاء
 */

import { registry } from "./adapters/index";
import * as deviceDb from "../deviceDb";
import { recordAttendance } from "../db";
import { formatError, formatErrorStack } from "./core/errors";
import type { Device } from "../../drizzle/schema";
import type { DeviceAttendanceRecord, DeviceEmployee, SyncResult } from "./core/types";

// ============= المزامنة الفردية =============

/**
 * تنفيذ مزامنة كاملة لجهاز واحد
 * @param deviceId معرف الجهاز
 * @param syncType نوع المزامنة
 */
export async function syncDevice(
  deviceId: number,
  syncType: "full" | "incremental" | "employees_only" | "attendance_only" = "incremental"
): Promise<SyncResult> {
  const startedAt = new Date();
  const result: SyncResult = {
    success: false,
    employeesImported: 0,
    attendanceImported: 0,
    duplicatesSkipped: 0,
    errors: [],
    durationMs: 0,
  };

  // إنشاء سجل في قاعدة البيانات
  const syncLog = await deviceDb.createSyncLog({
    deviceId,
    syncType,
    status: "running",
    employeesImported: 0,
    attendanceImported: 0,
    duplicatesSkipped: 0,
    startedAt,
  });

  const device = await deviceDb.getDeviceById(deviceId);
  if (!device) {
    await _failSyncLog(syncLog.id, "الجهاز غير موجود في قاعدة البيانات");
    result.errors.push("الجهاز غير موجود");
    return result;
  }

  console.log(`[SyncService] بدء مزامنة "${device.name}" (نوع: ${syncType})`);

  const adapter = registry.getAdapter({
    id: device.id,
    name: device.name,
    brand: device.brand,
    model: device.model,
    protocol: device.protocol,
    ipAddress: device.ipAddress,
    port: device.port,
    timeoutSeconds: device.timeoutSeconds,
    password: device.password,
  });

  try {
    await adapter.connect();

    // --- مزامنة الموظفين ---
    if (syncType !== "attendance_only") {
      try {
        const employees = await adapter.getEmployees();
        result.employeesImported = await _importEmployees(device, employees);
      } catch (err) {
        const msg = `خطأ في استيراد الموظفين: ${formatError(err)}`;
        result.errors.push(msg);
        await deviceDb.createConnectionError({
          deviceId,
          operation: "import_employees",
          message: msg,
          stack: formatErrorStack(err),
        }).catch(() => undefined);
        console.error(`[SyncService] ${msg}`);
      }
    }

    // --- مزامنة سجلات الحضور ---
    if (syncType !== "employees_only") {
      try {
        const since = syncType === "incremental"
          ? (device.lastAttendanceTimestamp ?? undefined)
          : undefined;

        const logs = await adapter.getAttendanceLogs(since ?? undefined);
        const importResult = await _importAttendanceLogs(device, logs);
        result.attendanceImported = importResult.imported;
        result.duplicatesSkipped = importResult.duplicates;
      } catch (err) {
        const msg = `خطأ في استيراد سجلات الحضور: ${formatError(err)}`;
        result.errors.push(msg);
        await deviceDb.createConnectionError({
          deviceId,
          operation: "import_attendance",
          message: msg,
          stack: formatErrorStack(err),
        }).catch(() => undefined);
        console.error(`[SyncService] ${msg}`);
      }
    }

    result.success = result.errors.length === 0;

    // تحديث حالة الجهاز
    const status = result.errors.length === 0 ? "success" :
                   result.attendanceImported > 0 ? "partial" : "failed";

    await deviceDb.updateDeviceSyncStatus(deviceId, status);

  } catch (err) {
    const msg = formatError(err);
    result.errors.push(msg);
    await deviceDb.updateDeviceConnectionStatus(deviceId, "error").catch(() => undefined);
    await deviceDb.createConnectionError({
      deviceId,
      operation: "sync",
      message: msg,
      stack: formatErrorStack(err),
    }).catch(() => undefined);
    console.error(`[SyncService] خطأ في مزامنة "${device.name}": ${msg}`);
    await deviceDb.updateDeviceSyncStatus(deviceId, "failed");
  } finally {
    try {
      await adapter.disconnect();
    } catch { /* تجاهل */ }
  }

  result.durationMs = Date.now() - startedAt.getTime();

  // تحديث سجل المزامنة
  const finalStatus = result.success ? "success" :
                      result.attendanceImported > 0 ? "partial" : "failed";

  await deviceDb.updateSyncLog(syncLog.id, {
    status: finalStatus,
    employeesImported: result.employeesImported,
    attendanceImported: result.attendanceImported,
    duplicatesSkipped: result.duplicatesSkipped,
    errorMessage: result.errors.length > 0 ? result.errors.join(" | ") : null,
    completedAt: new Date(),
    durationMs: result.durationMs,
  });

  console.log(
    `[SyncService] انتهت مزامنة "${device.name}": ` +
    `موظفون=${result.employeesImported}, حضور=${result.attendanceImported}, ` +
    `مكرر=${result.duplicatesSkipped}, ` +
    `(${result.durationMs}ms)`
  );

  return result;
}

// ============= استيراد الموظفين =============

async function _importEmployees(
  device: Device,
  employees: DeviceEmployee[]
): Promise<number> {
  let imported = 0;

  for (const emp of employees) {
    await deviceDb.upsertDeviceEmployeeMapping(
      device.id,
      emp.deviceUserId,
      emp.name
    );
    imported++;
  }

  return imported;
}

// ============= استيراد سجلات الحضور =============

async function _importAttendanceLogs(
  device: Device,
  logs: DeviceAttendanceRecord[]
): Promise<{ imported: number; duplicates: number }> {
  let imported = 0;
  let duplicates = 0;

  // ترتيب السجلات زمنياً
  const sorted = [...logs].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );

  // جلب ربط الموظفين للجهاز
  const mappings = await deviceDb.getMappingsForDevice(device.id);
  const mappingByDeviceUserId = new Map(
    mappings.map((m) => [m.deviceUserId, m])
  );

  let latestTimestamp: Date | undefined;

  for (const log of sorted) {
    const mapping = mappingByDeviceUserId.get(log.deviceUserId);
    if (!mapping?.employeeId) {
      // الموظف غير مربوط بالنظام - سجّل الربط لكن لا تستورد السجل
      await deviceDb.upsertDeviceEmployeeMapping(
        device.id,
        log.deviceUserId
      );
      continue;
    }

    const employeeId = mapping.employeeId;

    // تحقق من التكرار
    const isDuplicate = await deviceDb.isDuplicateAttendance(
      employeeId,
      log.recordedAt
    );

    if (isDuplicate) {
      duplicates++;
      continue;
    }

    // تسجيل الحضور عبر منطق النظام الأساسي
    try {
      await recordAttendance(
        employeeId,
        log.inOutType === 1 || log.inOutType === 5 ? "checkout" : "checkin",
        false,
        `استيراد من جهاز: ${device.name}`,
        log.recordedAt,
      );

      imported++;
      if (!latestTimestamp || log.recordedAt > latestTimestamp) {
        latestTimestamp = log.recordedAt;
      }
    } catch (err) {
      console.error(
        `[SyncService] خطأ في تسجيل حضور الموظف ${employeeId} من جهاز ${device.name}: ${formatError(err)}`
      );
    }
  }

  // تحديث آخر طابع زمني مستورد لاستخدامه في المزامنة التفاضلية
  if (latestTimestamp) {
    await deviceDb.updateDeviceSyncStatus(device.id, "success", latestTimestamp);
  }

  return { imported, duplicates };
}

// ============= المزامنة التلقائية الدورية =============

const _syncTimers = new Map<number, ReturnType<typeof setInterval>>();

/** تشغيل المزامنة التلقائية لجهاز محدد */
export async function startAutoSync(deviceId: number): Promise<void> {
  if (_syncTimers.has(deviceId)) return; // يعمل بالفعل

  const device = await deviceDb.getDeviceById(deviceId);
  if (!device || !device.autoSyncEnabled || !device.isActive) return;

  const intervalMs = device.syncIntervalMinutes * 60 * 1000;

  const timer = setInterval(async () => {
    console.log(`[SyncService] مزامنة تلقائية للجهاز #${deviceId}`);
    try {
      await syncDevice(deviceId, "incremental");
    } catch (err) {
      console.error(
        `[SyncService] فشل المزامنة التلقائية للجهاز #${deviceId}: ${formatError(err)}`
      );
    }
  }, intervalMs);

  _syncTimers.set(deviceId, timer);
  console.log(
    `[SyncService] بدأ المزامنة التلقائية للجهاز #${deviceId} كل ${device.syncIntervalMinutes} دقيقة`
  );
}

/** إيقاف المزامنة التلقائية لجهاز محدد */
export function stopAutoSync(deviceId: number): void {
  const timer = _syncTimers.get(deviceId);
  if (timer) {
    clearInterval(timer);
    _syncTimers.delete(deviceId);
    console.log(`[SyncService] أُوقفت المزامنة التلقائية للجهاز #${deviceId}`);
  }
}

/** تشغيل المزامنة التلقائية لجميع الأجهزة النشطة */
export async function startAllAutoSync(): Promise<void> {
  const allDevices = await deviceDb.getAllDevices();
  for (const device of allDevices) {
    if (device.isActive && device.autoSyncEnabled) {
      await startAutoSync(device.id);
    }
  }
  console.log(
    `[SyncService] تشغيل المزامنة التلقائية لـ ${allDevices.filter(d => d.isActive && d.autoSyncEnabled).length} جهاز`
  );
}

// ============= مساعدات داخلية =============

async function _failSyncLog(logId: number, message: string): Promise<void> {
  await deviceDb.updateSyncLog(logId, {
    status: "failed",
    errorMessage: message,
    completedAt: new Date(),
    durationMs: 0,
  });
}
