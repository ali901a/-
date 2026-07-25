/**
 * DeviceManager - واجهة عالية المستوى لطبقة تكامل الأجهزة
 *
 * هذا هو الملف الوحيد الذي يجب أن يستورده بقية النظام (الرواتر، الجداول الزمنية...).
 * يُخفي تفاصيل المحولات والبروتوكولات عن بقية التطبيق.
 */

import { registry } from "./adapters/index";
import * as deviceDb from "../deviceDb";
import { syncDevice, startAutoSync, stopAutoSync, startAllAutoSync } from "./SyncService";
import type { Device } from "../../drizzle/schema";
import type { ConnectionTestResult, SyncResult } from "./core/types";

export class DeviceManager {
  /** تهيئة المزامنة التلقائية عند بدء الخادم */
  async initialize(): Promise<void> {
    try {
      await startAllAutoSync();
    } catch (err) {
      console.error("[DeviceManager] خطأ في التهيئة:", err);
    }
  }

  /** اختبار اتصال جهاز بمعرفه */
  async testDevice(deviceId: number): Promise<ConnectionTestResult> {
    const device = await deviceDb.getDeviceById(deviceId);
    if (!device) throw new Error(`الجهاز #${deviceId} غير موجود`);

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

    return adapter.testConnection();
  }

  /** اختبار اتصال جهاز بإعداداته مباشرة (قبل الحفظ) */
  async testDeviceConfig(config: {
    brand: string;
    model: string;
    protocol: "tcp" | "sdk" | "simulated";
    ipAddress: string;
    port: number;
    timeoutSeconds: number;
    password?: string;
  }): Promise<ConnectionTestResult> {
    const adapter = registry.getAdapter({
      id: 0,
      name: "test-connection",
      ...config,
    });
    return adapter.testConnection();
  }

  /** تشغيل مزامنة يدوية فورية */
  async manualSync(
    deviceId: number,
    type: "full" | "incremental" | "employees_only" | "attendance_only" = "incremental"
  ): Promise<SyncResult> {
    return syncDevice(deviceId, type);
  }

  /** تفعيل/إيقاف المزامنة التلقائية لجهاز */
  async setAutoSync(deviceId: number, enabled: boolean): Promise<void> {
    await deviceDb.updateDevice(deviceId, { autoSyncEnabled: enabled });
    if (enabled) {
      await startAutoSync(deviceId);
    } else {
      stopAutoSync(deviceId);
    }
  }

  /** ربط مستخدم جهاز بموظف في النظام */
  async linkEmployee(mappingId: number, employeeId: number): Promise<void> {
    await deviceDb.linkEmployeeToDevice(mappingId, employeeId);
  }

  /** قائمة المحولات المسجلة */
  getRegisteredAdapters() {
    return registry.listRegistered();
  }
}

/** مدير الأجهزة العالمي */
export const deviceManager = new DeviceManager();
