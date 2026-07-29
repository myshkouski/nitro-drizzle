CREATE TABLE `authors` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	CONSTRAINT `authors_id` PRIMARY KEY(`id`)
);
