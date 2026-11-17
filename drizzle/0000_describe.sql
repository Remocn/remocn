CREATE TABLE "describe_answers" (
	"component" text NOT NULL,
	"query" text NOT NULL,
	"start" text DEFAULT '' NOT NULL,
	"on_topic" integer NOT NULL,
	"patch" jsonb NOT NULL,
	"hits" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "describe_answers_component_query_start_pk" PRIMARY KEY("component","query","start")
);
--> statement-breakpoint
CREATE TABLE "describe_bans" (
	"client" text PRIMARY KEY NOT NULL,
	"banned_until" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "describe_quotas" (
	"client" text NOT NULL,
	"day" date NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "describe_quotas_client_day_pk" PRIMARY KEY("client","day")
);
--> statement-breakpoint
CREATE TABLE "describe_spend" (
	"day" date PRIMARY KEY NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"input_tokens" bigint DEFAULT 0 NOT NULL,
	"output_tokens" bigint DEFAULT 0 NOT NULL,
	"cost_micros" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "describe_strikes" (
	"id" serial PRIMARY KEY NOT NULL,
	"client" text NOT NULL,
	"reason" text NOT NULL,
	"component" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "describe_strikes_client" ON "describe_strikes" USING btree ("client","created_at");