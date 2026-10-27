CREATE TABLE `holding` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`assetClass` text NOT NULL,
	`wallet` text NOT NULL,
	`symbol` text NOT NULL,
	`label` text NOT NULL,
	`quantity` real NOT NULL,
	`avgCostCents` real DEFAULT 0 NOT NULL,
	`lastPriceCents` real,
	`lastPriceAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `holding_user_idx` ON `holding` (`userId`);--> statement-breakpoint
CREATE TABLE `net_worth_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`date` text NOT NULL,
	`holdingsCents` integer NOT NULL,
	`investedCents` integer NOT NULL,
	`cashCents` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nws_user_date_unique` ON `net_worth_snapshot` (`userId`,`date`);