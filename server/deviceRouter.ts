/**
 * tRPC Router لإدارة أجهزة البصمة
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import * as deviceDb from "./deviceDb";
import { deviceManager } from "./devices/DeviceManager";

const adminOnly = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const deviceInput = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  brand: z.enum(["zkteco", "other"]).default("zkteco"),
  model: z.string().min(1).default("generic"),
  protocol: z.enum(["tcp", "sdk", "simulated"]).default("tcp"),
  ipAddress: z.string().min(1, "عنوان IP مطلوب"),
  port: z.number().int().min(1).max(65535).default(4370),
  timeoutSeconds: z.number().int().min(1).max(60).default(10),
  password: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  autoSyncEnabled: z.boolean().default(true),
  syncIntervalMinutes: z.number().int().min(5).max(1440).default(30),
});

export const deviceRouter = router({
  // ============= إدارة الأجهزة =============

  list: adminOnly.query(async () => {
    return deviceDb.getAllDevices();
  }),

  getById: adminOnly
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const device = await deviceDb.getDeviceById(input.id);
      if (!device) throw new TRPCError({ code: "NOT_FOUND", message: "الجهاز غير موجود" });
      return device;
    }),

  create: adminOnly
    .input(deviceInput)
    .mutation(async ({ input }) => {
      const device = await deviceDb.createDevice({
        name: input.name,
        brand: input.brand,
        model: input.model,
        protocol: input.protocol,
        ipAddress: input.ipAddress,
        port: input.port,
        timeoutSeconds: input.timeoutSeconds,
        password: input.password,
        location: input.location,
        notes: input.notes,
        isActive: input.isActive,
        autoSyncEnabled: input.autoSyncEnabled,
        syncIntervalMinutes: input.syncIntervalMinutes,
      });
      if (device.isActive && device.autoSyncEnabled) {
        deviceManager.setAutoSync(device.id, true).catch(console.error);
      }
      return device;
    }),

  update: adminOnly
    .input(z.object({ id: z.number() }).merge(deviceInput.partial()))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const device = await deviceDb.updateDevice(id, data);
      // إعادة ضبط المزامنة التلقائية
      if (data.autoSyncEnabled !== undefined) {
        deviceManager.setAutoSync(id, data.autoSyncEnabled).catch(console.error);
      }
      return device;
    }),

  delete: adminOnly
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      deviceManager.setAutoSync(input.id, false);
      await deviceDb.deleteDevice(input.id);
      return { success: true };
    }),

  // ============= اختبار الاتصال =============

  testConnection: adminOnly
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deviceManager.testDevice(input.id);
    }),

  testConnectionConfig: adminOnly
    .input(z.object({
      brand: z.enum(["zkteco", "other"]).default("zkteco"),
      model: z.string().default("generic"),
      protocol: z.enum(["tcp", "sdk", "simulated"]).default("tcp"),
      ipAddress: z.string().min(1),
      port: z.number().int().min(1).max(65535).default(4370),
      timeoutSeconds: z.number().int().min(1).max(60).default(10),
      password: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return deviceManager.testDeviceConfig(input);
    }),

  // ============= المزامنة =============

  sync: adminOnly
    .input(z.object({
      id: z.number(),
      type: z.enum(["full", "incremental", "employees_only", "attendance_only"]).default("incremental"),
    }))
    .mutation(async ({ input }) => {
      return deviceManager.manualSync(input.id, input.type);
    }),

  // ============= سجلات المزامنة =============

  syncLogs: adminOnly
    .input(z.object({ deviceId: z.number(), limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      return deviceDb.getSyncLogs(input.deviceId, input.limit);
    }),

  recentSyncLogs: adminOnly
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      return deviceDb.getRecentSyncLogs(input.limit);
    }),

  // ============= ربط الموظفين =============

  getMappings: adminOnly
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input }) => {
      const mappings = await deviceDb.getMappingsForDevice(input.deviceId);
      return mappings;
    }),

  getUnlinkedMappings: adminOnly
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input }) => {
      return deviceDb.getUnlinkedMappings(input.deviceId);
    }),

  linkEmployee: adminOnly
    .input(z.object({ mappingId: z.number(), employeeId: z.number() }))
    .mutation(async ({ input }) => {
      await deviceManager.linkEmployee(input.mappingId, input.employeeId);
      return { success: true };
    }),

  // ============= معلومات عامة =============

  registeredAdapters: adminOnly.query(async () => {
    return deviceManager.getRegisteredAdapters();
  }),
});
