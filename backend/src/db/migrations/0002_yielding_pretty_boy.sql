ALTER TABLE "items" RENAME TO "item";--> statement-breakpoint
ALTER TABLE "shopping_lists" RENAME TO "shopping_list";--> statement-breakpoint
ALTER TABLE "shopping_list_items" RENAME TO "shopping_list_item";--> statement-breakpoint
ALTER TABLE "shopping_list_item" DROP CONSTRAINT "shopping_list_items_list_id_shopping_lists_id_fk";
--> statement-breakpoint
ALTER TABLE "shopping_list_item" DROP CONSTRAINT "shopping_list_items_item_id_items_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shopping_list_item" ADD CONSTRAINT "shopping_list_item_list_id_shopping_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."shopping_list"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shopping_list_item" ADD CONSTRAINT "shopping_list_item_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
