CREATE TYPE "public"."recommendation_issue_type" AS ENUM('technical', 'content');--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"issue_type" "recommendation_issue_type" NOT NULL,
	"issue_id" uuid NOT NULL,
	"variant" text DEFAULT 'simplified' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendations_issue_id_variant_unique" UNIQUE("issue_id","variant")
);
--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;