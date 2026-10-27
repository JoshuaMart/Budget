PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_holding` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`assetClass` text NOT NULL,
	`wallet` text NOT NULL,
	`symbol` text NOT NULL,
	`label` text NOT NULL,
	`quantity` real NOT NULL,
	`avgCostCents` real,
	`lastPriceCents` real,
	`lastPriceAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_holding`("id", "userId", "assetClass", "wallet", "symbol", "label", "quantity", "avgCostCents", "lastPriceCents", "lastPriceAt", "createdAt") SELECT "id", "userId", "assetClass", "wallet", "symbol", "label", "quantity", "avgCostCents", "lastPriceCents", "lastPriceAt", "createdAt" FROM `holding`;--> statement-breakpoint
DROP TABLE `holding`;--> statement-breakpoint
ALTER TABLE `__new_holding` RENAME TO `holding`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `holding_user_idx` ON `holding` (`userId`);