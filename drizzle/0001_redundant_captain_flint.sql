CREATE TABLE `nutritionBackups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dataType` varchar(32) NOT NULL,
	`jsonData` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nutritionBackups_id` PRIMARY KEY(`id`)
);
