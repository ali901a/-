-- Full schema creation: enums + all tables

-- Enums
DO $$ BEGIN
  CREATE TYPE role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE record_type AS ENUM ('checkin', 'checkout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE shift_status AS ENUM ('incomplete', 'complete', 'absent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- users
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "openId" varchar(64) NOT NULL UNIQUE,
  "name" text,
  "email" varchar(320),
  "loginMethod" varchar(64),
  "role" role NOT NULL DEFAULT 'user',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "lastSignedIn" timestamp NOT NULL DEFAULT now()
);

-- shiftTemplates
CREATE TABLE IF NOT EXISTS "shiftTemplates" (
  "id" serial PRIMARY KEY,
  "name" varchar(100) NOT NULL,
  "startTime" varchar(5) NOT NULL,
  "endTime" varchar(5) NOT NULL,
  "isOvernight" boolean NOT NULL DEFAULT false,
  "gracePeriodMinutes" integer NOT NULL DEFAULT 15,
  "expectedWorkHours" numeric(5,2) NOT NULL,
  "workDays" text NOT NULL DEFAULT '[0,1,2,3,4]',
  "dayEndHour" integer NOT NULL DEFAULT 0,
  "notes" text,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- employees
CREATE TABLE IF NOT EXISTS "employees" (
  "id" serial PRIMARY KEY,
  "employeeNumber" varchar(50) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "email" varchar(320),
  "phone" varchar(20),
  "department" varchar(100) NOT NULL,
  "position" varchar(100),
  "status" status NOT NULL DEFAULT 'active',
  "hireDate" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- employeeShiftAssignments
CREATE TABLE IF NOT EXISTS "employeeShiftAssignments" (
  "id" serial PRIMARY KEY,
  "employeeId" integer NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "shiftTemplateId" integer NOT NULL REFERENCES "shiftTemplates"("id") ON DELETE CASCADE,
  "effectiveFrom" timestamp NOT NULL,
  "effectiveTo" timestamp,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- attendanceRecords
CREATE TABLE IF NOT EXISTS "attendanceRecords" (
  "id" serial PRIMARY KEY,
  "employeeId" integer NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "shiftDate" timestamp NOT NULL,
  "recordedAt" timestamp NOT NULL DEFAULT now(),
  "type" record_type NOT NULL,
  "notes" text,
  "isManualEntry" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- shifts
CREATE TABLE IF NOT EXISTS "shifts" (
  "id" serial PRIMARY KEY,
  "employeeId" integer NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "shiftDate" timestamp NOT NULL,
  "shiftTemplateId" integer REFERENCES "shiftTemplates"("id") ON DELETE SET NULL,
  "checkInTime" timestamp,
  "checkOutTime" timestamp,
  "workHours" numeric(5,2),
  "lateMinutes" integer NOT NULL DEFAULT 0,
  "earlyLeaveMinutes" integer NOT NULL DEFAULT 0,
  "overtimeMinutes" integer NOT NULL DEFAULT 0,
  "shortageMinutes" integer NOT NULL DEFAULT 0,
  "status" shift_status NOT NULL DEFAULT 'incomplete',
  "isManuallyEdited" boolean NOT NULL DEFAULT false,
  "editedBy" varchar(255),
  "editReason" text,
  "notes" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- attendanceEditLog
CREATE TABLE IF NOT EXISTS "attendanceEditLog" (
  "id" serial PRIMARY KEY,
  "shiftId" integer NOT NULL REFERENCES "shifts"("id") ON DELETE CASCADE,
  "editedByName" varchar(255),
  "editReason" text NOT NULL,
  "previousCheckIn" timestamp,
  "previousCheckOut" timestamp,
  "previousStatus" varchar(50),
  "newCheckIn" timestamp,
  "newCheckOut" timestamp,
  "newStatus" varchar(50),
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- dailyStatistics
CREATE TABLE IF NOT EXISTS "dailyStatistics" (
  "id" serial PRIMARY KEY,
  "date" timestamp NOT NULL,
  "totalEmployees" integer NOT NULL,
  "presentCount" integer NOT NULL,
  "absentCount" integer NOT NULL,
  "lateCount" integer NOT NULL,
  "earlyLeaveCount" integer NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON "attendanceRecords"("employeeId");
CREATE INDEX IF NOT EXISTS idx_attendance_shiftdate ON "attendanceRecords"("shiftDate");
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON "shifts"("employeeId");
CREATE INDEX IF NOT EXISTS idx_shifts_shiftdate ON "shifts"("shiftDate");
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON "employeeShiftAssignments"("employeeId");
