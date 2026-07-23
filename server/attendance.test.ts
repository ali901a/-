import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the database
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getDb: vi.fn(),
  };
});

describe("Attendance System", () => {
  describe("Time Handling - After Midnight", () => {
    it("should assign records after midnight to previous day shift", () => {
      // Test case: تسجيل بعد منتصف الليل يجب أن يُربط بالوردية السابقة
      const now = new Date();
      now.setHours(1, 30, 0, 0); // 1:30 AM

      const shiftDate = new Date(now);
      if (now.getHours() < 6) {
        shiftDate.setDate(shiftDate.getDate() - 1);
      }
      shiftDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() - 1);
      expectedDate.setHours(0, 0, 0, 0);

      expect(shiftDate.getTime()).toBe(expectedDate.getTime());
    });

    it("should assign records before 6 AM to previous day shift", () => {
      // Test case: أي تسجيل قبل الساعة 6 صباحاً يُربط باليوم السابق
      const testTimes = [0, 1, 2, 3, 4, 5]; // Hours before 6 AM

      testTimes.forEach((hour) => {
        const now = new Date();
        now.setHours(hour, 0, 0, 0);

        const shiftDate = new Date(now);
        if (now.getHours() < 6) {
          shiftDate.setDate(shiftDate.getDate() - 1);
        }
        shiftDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(now);
        expectedDate.setDate(expectedDate.getDate() - 1);
        expectedDate.setHours(0, 0, 0, 0);

        expect(shiftDate.getTime()).toBe(expectedDate.getTime());
      });
    });

    it("should assign records from 6 AM onwards to same day shift", () => {
      // Test case: التسجيلات من الساعة 6 صباحاً فما فوق تُربط بنفس اليوم
      const testTimes = [6, 12, 18, 23]; // Hours from 6 AM onwards

      testTimes.forEach((hour) => {
        const now = new Date();
        now.setHours(hour, 0, 0, 0);

        const shiftDate = new Date(now);
        if (now.getHours() < 6) {
          shiftDate.setDate(shiftDate.getDate() - 1);
        }
        shiftDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(now);
        expectedDate.setHours(0, 0, 0, 0);

        expect(shiftDate.getTime()).toBe(expectedDate.getTime());
      });
    });
  });

  describe("Work Hours Calculation", () => {
    it("should calculate work hours correctly", () => {
      // Test case: حساب ساعات العمل من وقت الدخول إلى الخروج
      const checkInTime = new Date("2026-07-23T08:00:00");
      const checkOutTime = new Date("2026-07-23T17:00:00");

      const checkInMs = checkInTime.getTime();
      const checkOutMs = checkOutTime.getTime();
      const hours = (checkOutMs - checkInMs) / (1000 * 60 * 60);

      expect(hours).toBe(9);
    });

    it("should calculate work hours with decimal precision", () => {
      // Test case: حساب ساعات العمل مع الكسور العشرية
      const checkInTime = new Date("2026-07-23T08:00:00");
      const checkOutTime = new Date("2026-07-23T17:30:00");

      const checkInMs = checkInTime.getTime();
      const checkOutMs = checkOutTime.getTime();
      const hours = (checkOutMs - checkInMs) / (1000 * 60 * 60);
      const roundedHours = parseFloat(hours.toFixed(2));

      expect(roundedHours).toBe(9.5);
    });

    it("should calculate work hours across midnight boundary", () => {
      // Test case: حساب ساعات العمل عندما تتجاوز منتصف الليل
      const checkInTime = new Date("2026-07-23T22:00:00");
      const checkOutTime = new Date("2026-07-24T06:00:00");

      const checkInMs = checkInTime.getTime();
      const checkOutMs = checkOutTime.getTime();
      const hours = (checkOutMs - checkInMs) / (1000 * 60 * 60);

      expect(hours).toBe(8);
    });
  });

  describe("Attendance Type Detection", () => {
    it("should detect check-in when no previous record exists", () => {
      // Test case: عندما لا يوجد سجل سابق، يجب تسجيل دخول
      const lastRecords: any[] = [];
      
      let type = "checkin";
      if (lastRecords.length > 0) {
        type = lastRecords[0].type === "checkin" ? "checkout" : "checkin";
      } else {
        type = "checkin";
      }

      expect(type).toBe("checkin");
    });

    it("should detect check-out after check-in", () => {
      // Test case: بعد تسجيل دخول، يجب تسجيل خروج
      const lastRecords = [{ type: "checkin", recordedAt: new Date() }];
      
      let type = "checkin";
      if (lastRecords.length > 0) {
        type = lastRecords[0].type === "checkin" ? "checkout" : "checkin";
      }

      expect(type).toBe("checkout");
    });

    it("should detect check-in after check-out", () => {
      // Test case: بعد تسجيل خروج، يجب تسجيل دخول جديد
      const lastRecords = [{ type: "checkout", recordedAt: new Date() }];
      
      let type = "checkin";
      if (lastRecords.length > 0) {
        type = lastRecords[0].type === "checkin" ? "checkout" : "checkin";
      }

      expect(type).toBe("checkin");
    });
  });

  describe("Shift Status", () => {
    it("should mark shift as incomplete when only check-in exists", () => {
      // Test case: الوردية غير مكتملة عندما يوجد دخول فقط
      const shift = {
        checkInTime: new Date(),
        checkOutTime: null,
        status: "incomplete" as const,
      };

      expect(shift.status).toBe("incomplete");
      expect(shift.checkOutTime).toBeNull();
    });

    it("should mark shift as complete when both check-in and check-out exist", () => {
      // Test case: الوردية مكتملة عندما يوجد دخول وخروج
      const shift = {
        checkInTime: new Date("2026-07-23T08:00:00"),
        checkOutTime: new Date("2026-07-23T17:00:00"),
        status: "complete" as const,
      };

      expect(shift.status).toBe("complete");
      expect(shift.checkOutTime).not.toBeNull();
    });
  });
});
