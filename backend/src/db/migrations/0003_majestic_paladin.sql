ALTER TABLE "item" ALTER COLUMN "description" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "item" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shopping_list" ALTER COLUMN "description" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shopping_list" ALTER COLUMN "description" DROP NOT NULL;