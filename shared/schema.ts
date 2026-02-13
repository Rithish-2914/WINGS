
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
  schoolName: text("school_name").notNull().default(""),
  principalName: text("principal_name").notNull().default(""),
  phoneNumber: text("phone_number").notNull().default(""),
  schoolType: text("school_type").notNull().default("Primary"),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  pincode: text("pincode").notNull().default(""),
  
  // Location & Photo
  locationLat: text("location_lat").notNull().default("0"),
  locationLng: text("location_lng").notNull().default("0"),
  photoUrl: text("photo_url").notNull(),
  
  // Contact Details
  schoolPhone: text("school_phone").notNull().default(""),
  contactPerson: text("contact_person"),
  contactMobile: text("contact_mobile"),
  
  // Meeting Details
  demoGiven: boolean("demo_given").default(false),
  mom: text("mom"), // Minutes of Meeting
  remarks: text("remarks"),
  
  // Follow-up Details
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  booksInterested: text("books_interested"), // Term, Semester, Individual
  
  // Samples
  sampleSubmitted: boolean("sample_submitted").default(false),
  booksSubmitted: jsonb("books_submitted").default([]), // Array of book names
  samplePhotoUrl: text("sample_photo_url"), // Photo of the samples provided
  products: jsonb("products").default([]), // Array of selected products
  
  createdAt: timestamp("created_at").defaultNow(),
  visitCount: integer("visit_count").default(1),
  photoMetadata: jsonb("photo_metadata"), // { timestamp: string, lat: string, lng: string }
  adminFollowUp: text("admin_follow_up"),
  adminFollowUpStatus: text("admin_follow_up_status").default("pending"), // 'pending' or 'completed'
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
  photoUrl: z.string().min(1, "Visit photo is required"),
  samplePhotoUrl: z.string().optional().nullable(),
  visitCount: z.number().min(1).default(1),
  contactMobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  schoolPhone: z.string().optional().nullable(),
  pincode: z.string().min(6, "Pincode must be 6 digits"),
  principalName: z.string().min(1, "Principal name is required"),
  schoolName: z.string().min(1, "School name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  visitType: z.string().min(1, "Visit type is required"),
  schoolType: z.string().min(1, "School type is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
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
