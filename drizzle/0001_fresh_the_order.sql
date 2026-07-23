CREATE TABLE `attendancePolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`expectedWorkHours` decimal(5,2) NOT NULL,
	`lateThresholdMinutes` int NOT NULL DEFAULT 15,
	`earlyLeaveThresholdMinutes` int NOT NULL DEFAULT 15,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendancePolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendanceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`shiftDate` datetime NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`type` enum('checkin','checkout') NOT NULL,
	`notes` text,
	`isManualEntry` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendanceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` datetime NOT NULL,
	`totalEmployees` int NOT NULL,
	`presentCount` int NOT NULL,
	`absentCount` int NOT NULL,
	`lateCount` int NOT NULL,
	`earlyLeaveCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyStatistics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeNumber` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`department` varchar(100) NOT NULL,
	`position` varchar(100),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`hireDate` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employeeNumber_unique` UNIQUE(`employeeNumber`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`shiftDate` datetime NOT NULL,
	`checkInTime` timestamp,
	`checkOutTime` timestamp,
	`workHours` decimal(5,2),
	`status` enum('incomplete','complete') NOT NULL DEFAULT 'incomplete',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
