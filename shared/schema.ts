
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
  schoolType: text("school_type"), // Pre school, Kindergarten, Primary
  address: text("address").notNull(),
  city: text("city").notNull(),
  pincode: text("pincode").notNull(),
  
  // Location & Photo
  locationLat: text("location_lat"),
  locationLng: text("location_lng"),
  photoUrl: text("photo_url"), // Path to uploaded photo
  
  // Contact Details
  schoolPhone: text("school_phone"),
  contactPerson: text("contact_person"),
  contactMobile: text("contact_mobile"),
  
  // Meeting Details
  demoGiven: boolean("demo_given").default(false),
  mom: text("mom"), // Minutes of Meeting
  remarks: text("remarks"),
  
  // Samples
  sampleSubmitted: boolean("sample_submitted").default(false),
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

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertVisitSchema = createInsertSchema(visits, {
  visitDate: z.coerce.date(),
  booksSubmitted: z.array(z.string()).optional(),
  products: z.array(z.string()).optional(),
  visitCount: z.number().min(1).default(1),
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
