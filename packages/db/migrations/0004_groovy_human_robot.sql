ALTER TABLE "recommendations" ADD COLUMN "decision_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "decision_by" text;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "decision_note" text;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "decision_at" timestamp;--> statement-breakpoint
ALTER TABLE "recommendations" ADD COLUMN "executed_at" timestamp;