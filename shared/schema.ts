
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Login ID (e.g. 1001)
  password: text("password").notNull(),
  role: text("role").notNull().default("executive"), // 'executive' or 'admin'
  name: text("name").notNull(),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Foreign key to users
  visitDate: timestamp("visit_date").notNull().defaultNow(),
  visitType: text("visit_type").notNull(), // 'First Visit' or 'Re-Visit'
  
  // School Details
  schoolName: text("school_name").notNull(),
  principalName: text("principal_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  schoolType: text("school_type").notNull(), // Pre school, Kindergarten, Primary
  address: text("address").notNull(),
  city: text("city").notNull(),
  pincode: text("pincode").notNull(),
  
  // Location & Photo
  locationLat: text("location_lat").notNull(),
  locationLng: text("location_lng").notNull(),
  photoUrl: text("photo_url").notNull(), // Path to uploaded photo
  
  // Contact Details
  schoolPhone: text("school_phone").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactMobile: text("contact_mobile").notNull(),
  
  // Meeting Details
  demoGiven: boolean("demo_given").notNull().default(false),
  mom: text("mom").notNull(), // Minutes of Meeting
  remarks: text("remarks"),
  
  // Follow-up Details
  followUpRequired: boolean("follow_up_required").notNull().default(false),
  followUpDate: timestamp("follow_up_date"),
  booksInterested: text("books_interested"), // Term, Semester, Individual
  
  // Samples
  sampleSubmitted: boolean("sample_submitted").notNull().default(false),
  booksSubmitted: jsonb("books_submitted"), // Array of book names
  products: jsonb("products"), // Array of selected products
  
  createdAt: timestamp("created_at").defaultNow(),
  visitCount: integer("visit_count").default(1),
  photoMetadata: jsonb("photo_metadata"), // { timestamp: string, lat: string, lng: string }
  adminFollowUp: text("admin_follow_up"),
});

export const targets = pgTable("targets", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  executiveId: integer("executive_id").notNull(),
  targetVisits: integer("target_visits").notNull(),
  targetDate: timestamp("target_date").notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sampleSubmissions = pgTable("sample_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  schoolName: text("school_name").notNull(),
  booksSubmitted: jsonb("books_submitted").default([]),
  photoUrl: text("photo_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSampleSubmissionSchema = createInsertSchema(sampleSubmissions, {
  booksSubmitted: z.array(z.string()).optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export type SampleSubmission = typeof sampleSubmissions.$inferSelect;
export type InsertSampleSubmission = z.infer<typeof insertSampleSubmissionSchema>;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertVisitSchema = createInsertSchema(visits, {
  visitDate: z.coerce.date(),
  followUpDate: z.coerce.date().optional().nullable(),
  booksSubmitted: z.array(z.string()).optional().nullable(),
  products: z.array(z.string()).optional().nullable(),
  visitCount: z.number().min(1).default(1),
  contactMobile: z.string().length(10, "Mobile number must be exactly 10 digits"),
  pincode: z.string().regex(/^\d+$/, "Pincode must be numerical"),
}).omit({ 
  id: true, 
  createdAt: true,
  userId: true 
});

export const insertTargetSchema = createInsertSchema(targets, {
  targetDate: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
  adminId: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Target = typeof targets.$inferSelect;
export type InsertTarget = z.infer<typeof insertTargetSchema>;

// API Types
export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  user: User;
};
