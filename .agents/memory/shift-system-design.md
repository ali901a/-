---
name: Shift system design
description: Key decisions for the professional attendance/shift system added in July 2026
---

# Shift System Design Decisions

## Business Day Boundary
`getBusinessDay(timestamp, dayEndHour)` in `server/db.ts` — if `dayEndHour > 0` and the punch time is before that hour, it belongs to the previous calendar day. E.g. dayEndHour=4 means 01:30 AM punch → previous day's shift.

**Why:** Night shifts that cross midnight need all punches attributed to the shift's start date, not the clock date.

**How to apply:** Always call `getBusinessDay` before `getOrCreateShift`. The dayEndHour comes from the employee's active shift template.

## Shift Metrics
`calculateShiftMetrics(checkIn, checkOut, businessDay, template)` returns: workHours, lateMinutes, earlyLeaveMinutes, overtimeMinutes, shortageMinutes.
- lateMinutes = max(0, (actualCheckIn - scheduledStart) - gracePeriodMinutes)
- earlyLeaveMinutes = max(0, scheduledEnd - actualCheckOut)
- overtime/shortage derived from actual vs expected work hours

## Auto Check-in/Checkout Detection
`recordAttendance` inspects `getLastAttendanceRecord` — if last record was `checkout` (or no record), next is `checkin`; if `checkin`, next is `checkout`. Override via `overrideType` param.

## Manual Edits Audit Trail
Every manual shift edit writes to `attendanceEditLog` with before/after times and editor name. The `isManuallyEdited` flag on `shifts` enables UI badge.

## Database Schema (new tables July 2026)
- `shiftTemplates` — shift definitions (startTime/endTime as "HH:MM" strings, isOvernight bool, dayEndHour int)
- `employeeShiftAssignments` — employee↔template bindings with effectiveFrom/effectiveTo
- `attendanceEditLog` — audit trail for manual edits
- `shifts` extended with: shiftTemplateId, lateMinutes, earlyLeaveMinutes, overtimeMinutes, shortageMinutes, isManuallyEdited, editedBy, editReason
- `shift_status` enum: incomplete | complete | absent

## Migration
All tables created in `drizzle/0001_shift_system.sql`. Run via `node -e "pool.query(fs.readFileSync(...))"` — drizzle-kit was NOT used (schema was hand-written).
