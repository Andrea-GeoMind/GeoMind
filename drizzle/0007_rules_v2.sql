-- TKT-RULES-V2 — Règles GEO V2 (cahier-des-charges §18)
-- Sévérités + effort/impact + analyse page par page + version de méthodologie

CREATE TYPE "public"."issue_severity" AS ENUM('major', 'moderate', 'minor', 'opportunity');--> statement-breakpoint
ALTER TABLE "technical_issues" ADD COLUMN "severity" "issue_severity";--> statement-breakpoint
ALTER TABLE "technical_issues" ADD COLUMN "effort" integer NOT NULL DEFAULT 2;--> statement-breakpoint
ALTER TABLE "technical_issues" ADD COLUMN "impact" integer NOT NULL DEFAULT 2;--> statement-breakpoint
ALTER TABLE "technical_issues" ADD COLUMN "page_url" text;--> statement-breakpoint
ALTER TABLE "content_issues" ADD COLUMN "severity" "issue_severity";--> statement-breakpoint
ALTER TABLE "content_issues" ADD COLUMN "effort" integer NOT NULL DEFAULT 2;--> statement-breakpoint
ALTER TABLE "content_issues" ADD COLUMN "impact" integer NOT NULL DEFAULT 2;--> statement-breakpoint
ALTER TABLE "content_issues" ADD COLUMN "page_url" text;--> statement-breakpoint

-- Rétro-déduction de la sévérité des issues V1 depuis leur pénalité (§18.8)
UPDATE "technical_issues" SET "severity" = CASE
  WHEN "penalty" >= 12 THEN 'major'::"issue_severity"
  WHEN "penalty" >= 6 THEN 'moderate'::"issue_severity"
  ELSE 'minor'::"issue_severity"
END WHERE "severity" IS NULL;--> statement-breakpoint
UPDATE "content_issues" SET "severity" = CASE
  WHEN "penalty" >= 12 THEN 'major'::"issue_severity"
  WHEN "penalty" >= 6 THEN 'moderate'::"issue_severity"
  ELSE 'minor'::"issue_severity"
END WHERE "severity" IS NULL;--> statement-breakpoint

ALTER TABLE "technical_issues" ALTER COLUMN "severity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "technical_issues" ALTER COLUMN "severity" SET DEFAULT 'minor';--> statement-breakpoint
ALTER TABLE "content_issues" ALTER COLUMN "severity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "content_issues" ALTER COLUMN "severity" SET DEFAULT 'minor';--> statement-breakpoint

-- Version de méthodologie : les analyses existantes restent en V1,
-- les nouvelles écrivent 2 (badge "Méthodologie enrichie" sur les comparaisons)
ALTER TABLE "analyses" ADD COLUMN "rules_version" integer NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE "analyses" ALTER COLUMN "rules_version" SET DEFAULT 2;
