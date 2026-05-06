CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`label` text NOT NULL,
	`initialBalanceCents` integer DEFAULT 0 NOT NULL,
	`type` text DEFAULT 'checking' NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `account_auth` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`envelopeId` text NOT NULL,
	`label` text NOT NULL,
	`icon` text,
	`position` integer DEFAULT 0 NOT NULL,
	`isVirtual` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`envelopeId`) REFERENCES `envelope`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `envelope` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`ratio` integer NOT NULL,
	`color` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `envelope_user_key_unique` ON `envelope` (`userId`,`key`);--> statement-breakpoint
CREATE TABLE `recurring` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`merchant` text NOT NULL,
	`amountCents` integer NOT NULL,
	`frequency` text NOT NULL,
	`dayOfMonth` integer,
	`accountId` text NOT NULL,
	`toAccountId` text,
	`envelopeId` text,
	`categoryId` text,
	`incomeCategory` text,
	`kind` text NOT NULL,
	`nextDate` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`accountId`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`toAccountId`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`envelopeId`) REFERENCES `envelope`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `rec_user_active_next_idx` ON `recurring` (`userId`,`active`,`nextDate`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`date` text NOT NULL,
	`merchant` text NOT NULL,
	`amountCents` integer NOT NULL,
	`accountId` text NOT NULL,
	`toAccountId` text,
	`envelopeId` text,
	`categoryId` text,
	`incomeCategory` text,
	`kind` text DEFAULT 'expense' NOT NULL,
	`recurringId` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`accountId`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`toAccountId`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`envelopeId`) REFERENCES `envelope`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`recurringId`) REFERENCES `recurring`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tx_user_date_idx` ON `transaction` (`userId`,`date`);--> statement-breakpoint
CREATE INDEX `tx_user_envelope_date_idx` ON `transaction` (`userId`,`envelopeId`,`date`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
