import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { deviceRouter } from "./deviceRouter";

// ============= Admin Procedure =============
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  devices: deviceRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============= قوالب الورديات =============
  shiftTemplates: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllShiftTemplates();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const template = await db.getShiftTemplateById(input.id);
        if (!template) throw new TRPCError({ code: 'NOT_FOUND', message: 'Shift template not found' });
        return template;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
        isOvernight: z.boolean().default(false),
        gracePeriodMinutes: z.number().int().min(0).max(120).default(15),
        expectedWorkHours: z.number().min(0.5).max(24),
        workDays: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4]),
        dayEndHour: z.number().int().min(0).max(12).default(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const template = await db.createShiftTemplate({
          name: input.name,
          startTime: input.startTime,
          endTime: input.endTime,
          isOvernight: input.isOvernight,
          gracePeriodMinutes: input.gracePeriodMinutes,
          expectedWorkHours: input.expectedWorkHours.toString(),
          workDays: JSON.stringify(input.workDays),
          dayEndHour: input.dayEndHour,
          notes: input.notes,
          isActive: true,
        });
        return template;
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        isOvernight: z.boolean().optional(),
        gracePeriodMinutes: z.number().int().min(0).max(120).optional(),
        expectedWorkHours: z.number().min(0.5).max(24).optional(),
        workDays: z.array(z.number().int().min(0).max(6)).optional(),
        dayEndHour: z.number().int().min(0).max(12).optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, workDays, expectedWorkHours, ...rest } = input;
        const updateData: Record<string, unknown> = { ...rest };
        if (workDays !== undefined) updateData.workDays = JSON.stringify(workDays);
        if (expectedWorkHours !== undefined) updateData.expectedWorkHours = expectedWorkHours.toString();
        return await db.updateShiftTemplate(id, updateData as any);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteShiftTemplate(input.id);
        return { success: true };
      }),
  }),

  // ============= ربط الموظفين بالورديات =============
  assignments: router({
    list: adminProcedure.query(async () => {
      return await db.getAllAssignments();
    }),

    getForEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeAssignments(input.employeeId);
      }),

    getActive: protectedProcedure
      .input(z.object({ employeeId: z.number(), atDate: z.date().optional() }))
      .query(async ({ input }) => {
        return await db.getEmployeeActiveAssignment(input.employeeId, input.atDate);
      }),

    assign: adminProcedure
      .input(z.object({
        employeeId: z.number(),
        shiftTemplateId: z.number(),
        effectiveFrom: z.date(),
        effectiveTo: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.assignEmployeeToShift({
          employeeId: input.employeeId,
          shiftTemplateId: input.shiftTemplateId,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo ?? null,
          isActive: true,
        });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        effectiveTo: z.date().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateAssignment(id, data as any);
      }),

    remove: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeAssignment(input.id);
        return { success: true };
      }),
  }),

  // ============= الموظفون =============
  employees: router({
    list: adminProcedure.query(async () => {
      return await db.getAllEmployees();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const employee = await db.getEmployeeById(input.id);
        if (!employee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found' });
        return employee;
      }),

    getByNumber: protectedProcedure
      .input(z.object({ employeeNumber: z.string() }))
      .query(async ({ input }) => {
        const employee = await db.getEmployeeByNumber(input.employeeNumber);
        if (!employee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found' });
        return employee;
      }),

    create: adminProcedure
      .input(z.object({
        employeeNumber: z.string().min(1),
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        department: z.string().min(1),
        position: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await db.createEmployee({ ...input, status: 'active' });
          return { success: true };
        } catch (error: any) {
          if (error.code === '23505') throw new TRPCError({ code: 'CONFLICT', message: 'Employee number already exists' });
          throw error;
        }
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        status: z.enum(['active', 'inactive']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        await db.updateEmployee(id, updateData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEmployee(input.id);
        return { success: true };
      }),
  }),

  // ============= الحضور والانصراف =============
  attendance: router({
    record: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        type: z.enum(['checkin', 'checkout']).optional(),
        isManualEntry: z.boolean().optional(),
        notes: z.string().optional(),
        recordedAt: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        try {
          const result = await db.recordAttendance(
            input.employeeId,
            input.type,
            input.isManualEntry ?? false,
            input.notes,
            input.recordedAt ?? new Date()
          );
          return { success: true, type: result.type };
        } catch (error) {
          console.error('Error recording attendance:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to record attendance' });
        }
      }),

    getRecords: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        return await db.getAttendanceRecords(input.employeeId, input.startDate, input.endDate);
      }),

    recent: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        return await db.getRecentAttendanceRecords(20);
      }),

    getShifts: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        if (input.employeeId) {
          return await db.getEmployeeShifts(input.employeeId, input.startDate, input.endDate);
        }
        return await db.getAllShifts(input.startDate, input.endDate);
      }),

    editShift: adminProcedure
      .input(z.object({
        shiftId: z.number(),
        checkIn: z.date().nullable(),
        checkOut: z.date().nullable(),
        editReason: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const editorName = ctx.user.name ?? ctx.user.email ?? 'مدير النظام';
        return await db.manuallyEditShift(
          input.shiftId,
          input.checkIn,
          input.checkOut,
          input.editReason,
          editorName
        );
      }),

    getShiftEditLog: adminProcedure
      .input(z.object({ shiftId: z.number() }))
      .query(async ({ input }) => {
        return await db.getShiftEditLog(input.shiftId);
      }),
  }),

  // ============= الإحصائيات والتقارير =============
  statistics: router({
    daily: adminProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        return await db.calculateDailyStatistics(input.date);
      }),

    dashboard: adminProcedure.query(async () => {
      return await db.getDashboardStats();
    }),

    range: adminProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }))
      .query(async ({ input }) => {
        const allShifts = await db.getAllShifts(input.startDate, input.endDate);
        const totalWorkHours = allShifts.reduce((sum, s) => sum + parseFloat(s.workHours?.toString() ?? '0'), 0);
        const totalLateMinutes = allShifts.reduce((sum, s) => sum + (s.lateMinutes ?? 0), 0);
        const totalOvertimeMinutes = allShifts.reduce((sum, s) => sum + (s.overtimeMinutes ?? 0), 0);
        return {
          totalShifts: allShifts.length,
          completedShifts: allShifts.filter(s => s.status === 'complete').length,
          totalWorkHours,
          totalLateMinutes,
          totalOvertimeMinutes,
          lateCount: allShifts.filter(s => (s.lateMinutes ?? 0) > 0).length,
          earlyLeaveCount: allShifts.filter(s => (s.earlyLeaveMinutes ?? 0) > 0).length,
          overtimeCount: allShifts.filter(s => (s.overtimeMinutes ?? 0) > 0).length,
        };
      }),

    chart: adminProcedure
      .input(z.object({ days: z.number().int().min(7).max(365).default(30) }))
      .query(async ({ input }) => {
        return await db.getAttendanceChartData(input.days);
      }),

    employeesSummary: adminProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
        department: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAllEmployeesSummary(input.startDate, input.endDate, input.department);
      }),

    departments: adminProcedure.query(async () => {
      return await db.getAllDepartments();
    }),
  }),

  // ============= العطل الرسمية =============
  holidays: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllHolidays();
    }),

    create: adminProcedure
      .input(z.object({
        date: z.date(),
        name: z.string().min(1),
        isRecurringYearly: z.boolean().default(false),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          return await db.createHoliday({
            date: input.date,
            name: input.name,
            isRecurringYearly: input.isRecurringYearly,
            notes: input.notes,
          });
        } catch (err: any) {
          if (err.code === '23505') {
            throw new TRPCError({ code: 'CONFLICT', message: 'يوجد عطلة بهذا التاريخ مسبقاً' });
          }
          throw err;
        }
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteHoliday(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
