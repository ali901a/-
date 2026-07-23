CREATE TYPE "public"."record_type" AS ENUM('checkin', 'checkout');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('incomplete', 'complete');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "attendancePolicies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"expectedWorkHours" numeric(5, 2) NOT NULL,
	"lateThresholdMinutes" integer DEFAULT 15 NOT NULL,
	"earlyLeaveThresholdMinutes" integer DEFAULT 15 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendanceRecords" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeId" integer NOT NULL,
	"shiftDate" timestamp NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL,
	"type" "record_type" NOT NULL,
	"notes" text,
	"isManualEntry" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dailyStatistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"totalEmployees" integer NOT NULL,
	"presentCount" integer NOT NULL,
	"absentCount" integer NOT NULL,
	"lateCount" integer NOT NULL,
	"earlyLeaveCount" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeNumber" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"phone" varchar(20),
	"department" varchar(100) NOT NULL,
	"position" varchar(100),
	"status" "status" DEFAULT 'active' NOT NULL,
	"hireDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employeeNumber_unique" UNIQUE("employeeNumber")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"employeeId" integer NOT NULL,
	"shiftDate" timestamp NOT NULL,
	"checkInTime" timestamp,
	"checkOutTime" timestamp,
	"workHours" numeric(5, 2),
	"status" "shift_status" DEFAULT 'incomplete' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
