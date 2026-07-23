import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { desc } from "drizzle-orm";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ============= Admin Procedure =============
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= الموظفون =============
  employees: router({
    // الحصول على قائمة جميع الموظفين (Admin فقط)
    list: adminProcedure.query(async () => {
      return await db.getAllEmployees();
    }),

    // الحصول على بيانات موظف محدد
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const employee = await db.getEmployeeById(input.id);
        if (!employee) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found' });
        }
        return employee;
      }),

    // البحث عن موظف برقمه
    getByNumber: protectedProcedure
      .input(z.object({ employeeNumber: z.string() }))
      .query(async ({ input }) => {
        const employee = await db.getEmployeeByNumber(input.employeeNumber);
        if (!employee) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found' });
        }
        return employee;
      }),

    // إضافة موظف جديد (Admin فقط)
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
          await db.createEmployee({
            employeeNumber: input.employeeNumber,
            name: input.name,
            email: input.email,
            phone: input.phone,
            department: input.department,
            position: input.position,
            status: 'active',
          });
          return { success: true };
        } catch (error: any) {
          // PostgreSQL unique violation error code
          if (error.code === '23505') {
            throw new TRPCError({ 
              code: 'CONFLICT', 
              message: 'Employee number already exists' 
            });
          }
          throw error;
        }
      }),

    // تعديل بيانات موظف (Admin فقط)
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

    // حذف موظف (Admin فقط)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEmployee(input.id);
        return { success: true };
      }),
  }),

  // ============= الحضور والانصراف =============
  attendance: router({
    // تسجيل الحضور أو الانصراف
    record: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        type: z.enum(['checkin', 'checkout']).optional(),
        isManualEntry: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // تحقق من أن المستخدم إما admin أو يسجل لنفسه
        if (ctx.user.role !== 'admin') {
          // في المستقبل، يمكن ربط المستخدم بموظف محدد
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        try {
          await db.recordAttendance(
            input.employeeId,
            input.type,
            input.isManualEntry,
            input.notes
          );
          return { success: true };
        } catch (error) {
          console.error('Error recording attendance:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to record attendance' });
        }
      }),

    // الحصول على سجلات الحضور لموظف
    getRecords: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // تحقق من الصلاحيات
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        return await db.getAttendanceRecords(
          input.employeeId,
          input.startDate,
          input.endDate
        );
      }),

    // الحصول على الورديات لموظف
    getShifts: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // تحقق من الصلاحيات
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        return await db.getEmployeeShifts(
          input.employeeId,
          input.startDate,
          input.endDate
        );
      }),
  }),

  // ============= الإحصائيات والتقارير =============
  statistics: router({
    // الحصول على إحصائيات يوم معين
    daily: adminProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        return await db.calculateDailyStatistics(input.date);
      }),

    // الحصول على إحصائيات نطاق زمني
    range: adminProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        // سيتم تطويره لاحقاً
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
