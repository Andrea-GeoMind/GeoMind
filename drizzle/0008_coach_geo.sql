-- TKT-COACH-V2 — GEO, le coach IA (cahier-des-charges §16)
-- Mémoire persistante par (user, site) + flag d'auto-ouverture unique

CREATE TABLE "coach_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"memory_summary" text NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_memory_user_site_unique" UNIQUE("user_id","site_id")
);
--> statement-breakpoint
ALTER TABLE "coach_memory" ADD CONSTRAINT "coach_memory_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_memory" ADD CONSTRAINT "coach_memory_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "coach_intro_seen" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- RLS (règle 11) : lecture par le propriétaire — écritures via Drizzle serveur uniquement
ALTER TABLE "coach_memory" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "coach_memory_select_own" ON "coach_memory" FOR SELECT USING (auth.uid() = user_id);
