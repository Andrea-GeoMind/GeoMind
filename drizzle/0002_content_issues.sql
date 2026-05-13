CREATE TYPE "public"."content_issue_category" AS ENUM('readability', 'metadata', 'structure', 'coverage');--> statement-breakpoint
CREATE TABLE "content_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"rule_key" text NOT NULL,
	"category" "content_issue_category" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"sample_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"penalty" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_issues" ADD CONSTRAINT "content_issues_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;
