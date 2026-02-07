CREATE TABLE "sample_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"school_name" text NOT NULL,
	"books_submitted" jsonb DEFAULT '[]'::jsonb,
	"photo_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"executive_id" integer NOT NULL,
	"target_visits" integer NOT NULL,
	"target_date" timestamp NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'executive' NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"visit_date" timestamp DEFAULT now() NOT NULL,
	"visit_type" text NOT NULL,
	"school_name" text DEFAULT '' NOT NULL,
	"principal_name" text DEFAULT '' NOT NULL,
	"phone_number" text DEFAULT '' NOT NULL,
	"school_type" text DEFAULT 'Primary' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"pincode" text DEFAULT '' NOT NULL,
	"location_lat" text DEFAULT '0' NOT NULL,
	"location_lng" text DEFAULT '0' NOT NULL,
	"photo_url" text DEFAULT '' NOT NULL,
	"school_phone" text DEFAULT '' NOT NULL,
	"contact_person" text,
	"contact_mobile" text,
	"demo_given" boolean DEFAULT false,
	"mom" text,
	"remarks" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"books_interested" text,
	"sample_submitted" boolean DEFAULT false,
	"books_submitted" jsonb DEFAULT '[]'::jsonb,
	"sample_photo_url" text,
	"products" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"visit_count" integer DEFAULT 1,
	"photo_metadata" jsonb,
	"admin_follow_up" text
);
