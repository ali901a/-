/**
 * وظائف قاعدة البيانات الخاصة بطبقة تكامل الأجهزة
 */

import { eq, and, desc, gte, isNull, or } from "drizzle-orm";
import { getDb } from "./db";
import {
  devices,
  deviceSyncLogs,
  deviceEmployeeMappings,
  attendanceRecords,
  type Device,
  type InsertDevice,
  type DeviceSyncLog,
  type InsertDeviceSyncLog,
  type DeviceEmployeeMapping,
  type InsertDeviceEmployeeMapping,
} from "../drizzle/schema";

// ============= الأجهزة =============

export async function getAllDevices(): Promise<Device[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(devices).orderBy(devices.name);
}

export async function getDeviceById(id: number): Promise<Device | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(devices).where(eq(devices.id, id));
  return rows[0] ?? null;
}

export async function createDevice(data: InsertDevice): Promise<Device> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.insert(devices).values(data).returning();
  if (!rows[0]) throw new Error("Failed to create device");
  return rows[0];
}

export async function updateDevice(
  id: number,
  data: Partial<InsertDevice>
): Promise<Device> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .update(devices)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(devices.id, id))
    .returning();
  if (!rows[0]) throw new Error("Device not found");
  return rows[0];
}

export async function deleteDevice(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(deviceEmployeeMappings).where(eq(deviceEmployeeMappings.deviceId, id));
  await db.delete(deviceSyncLogs).where(eq(deviceSyncLogs.deviceId, id));
  await db.delete(devices).where(eq(devices.id, id));
}

export async function updateDeviceSyncStatus(
  id: number,
  status: "success" | "failed" | "partial",
  lastAttendanceTimestamp?: Date
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(devices)
    .set({
      lastSyncAt: new Date(),
      lastSyncStatus: status,
      ...(lastAttendanceTimestamp ? { lastAttendanceTimestamp } : {}),
      updatedAt: new Date(),
    })
    .where(eq(devices.id, id));
}

// ============= سجلات المزامنة =============

export async function createSyncLog(
  data: Omit<InsertDeviceSyncLog, "id">
): Promise<DeviceSyncLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.insert(deviceSyncLogs).values(data).returning();
  if (!rows[0]) throw new Error("Failed to create sync log");
  return rows[0];
}

export async function updateSyncLog(
  id: number,
  data: Partial<InsertDeviceSyncLog>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(deviceSyncLogs)
    .set(data)
    .where(eq(deviceSyncLogs.id, id));
}

export async function getSyncLogs(
  deviceId: number,
  limit = 50
): Promise<DeviceSyncLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(deviceSyncLogs)
    .where(eq(deviceSyncLogs.deviceId, deviceId))
    .orderBy(desc(deviceSyncLogs.startedAt))
    .limit(limit);
}

export async function getRecentSyncLogs(limit = 20): Promise<DeviceSyncLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(deviceSyncLogs)
    .orderBy(desc(deviceSyncLogs.startedAt))
    .limit(limit);
}

// ============= ربط موظفي الأجهزة =============

export async function getMappingsForDevice(
  deviceId: number
): Promise<DeviceEmployeeMapping[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(deviceEmployeeMappings)
    .where(eq(deviceEmployeeMappings.deviceId, deviceId));
}

export async function upsertDeviceEmployeeMapping(
  deviceId: number,
  deviceUserId: string,
  deviceUserName?: string,
  employeeId?: number
): Promise<DeviceEmployeeMapping> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // تحقق من وجود الربط
  const existing = await db
    .select()
    .from(deviceEmployeeMappings)
    .where(
      and(
        eq(deviceEmployeeMappings.deviceId, deviceId),
        eq(deviceEmployeeMappings.deviceUserId, deviceUserId)
      )
    );

  if (existing[0]) {
    const rows = await db
      .update(deviceEmployeeMappings)
      .set({
        deviceUserName: deviceUserName ?? existing[0].deviceUserName,
        ...(employeeId !== undefined ? { employeeId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(deviceEmployeeMappings.id, existing[0].id))
      .returning();
    return rows[0]!;
  }

  const rows = await db
    .insert(deviceEmployeeMappings)
    .values({
      deviceId,
      deviceUserId,
      deviceUserName,
      employeeId,
      isActive: true,
    })
    .returning();
  return rows[0]!;
}

export async function linkEmployeeToDevice(
  mappingId: number,
  employeeId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(deviceEmployeeMappings)
    .set({ employeeId, updatedAt: new Date() })
    .where(eq(deviceEmployeeMappings.id, mappingId));
}

export async function getUnlinkedMappings(
  deviceId: number
): Promise<DeviceEmployeeMapping[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(deviceEmployeeMappings)
    .where(
      and(
        eq(deviceEmployeeMappings.deviceId, deviceId),
        isNull(deviceEmployeeMappings.employeeId)
      )
    );
}

// ============= منع التكرار في سجلات الحضور =============

/**
 * تحقق إذا كان السجل موجوداً بالفعل في قاعدة البيانات
 * يعتبر السجل مكرراً إذا كان لنفس الموظف وفي نفس الدقيقة
 */
export async function isDuplicateAttendance(
  employeeId: number,
  recordedAt: Date
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // نافذة تكرار: ±1 دقيقة
  const windowMs = 60 * 1000;
  const from = new Date(recordedAt.getTime() - windowMs);
  const to = new Date(recordedAt.getTime() + windowMs);

  const rows = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.employeeId, employeeId),
        gte(attendanceRecords.recordedAt, from),
        gte(to, attendanceRecords.recordedAt)
      )
    )
    .limit(1);

  return rows.length > 0;
}
