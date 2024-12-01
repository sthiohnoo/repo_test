CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(256) NOT NULL,
	"password" varchar(256) NOT NULL,
	"first_name" varchar(256) NOT NULL,
	"last_name" varchar(256) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "name" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "description" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shopping_lists" ALTER COLUMN "name" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "shopping_lists" ALTER COLUMN "description" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "shopping_lists" ALTER COLUMN "description" SET NOT NULL;