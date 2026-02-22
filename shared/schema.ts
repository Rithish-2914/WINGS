
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
  currentBooksUsed: text("current_books_used"),
  modeOfBooks: text("mode_of_books"), // 'Term', 'Semester', 'Individual'
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

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeaveSchema = createInsertSchema(leaves, {
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(1, "Reason is required"),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Page 1: Office Use & Mode
  schoolCode: text("school_code"),
  schoolNameOffice: text("school_name_office"),
  placeOffice: text("place_office"),
  modeOfOrder: text("mode_of_order"), // 'SCHOOL' or 'DISTRIBUTOR'
  modeOfSupply: text("mode_of_supply"), // 'SCHOOL' or 'DISTRIBUTOR'
  hasSchoolOrderCopy: boolean("has_school_order_copy").default(false),
  hasDistributorOrderCopy: boolean("has_distributor_order_copy").default(false),
  
  // Page 2: School Information
  schoolName: text("school_name").notNull(),
  trustName: text("trust_name"),
  board: text("board"),
  schoolType: text("school_type"),
  address: text("address"),
  pincode: text("pincode"),
  state: text("state"),
  emailId: text("email_id"),
  schoolPhone: text("school_phone"),
  
  // Page 3: Contact Details
  correspondentName: text("correspondent_name"),
  correspondentMobile: text("correspondent_mobile"),
  principalName: text("principal_name"),
  principalMobile: text("principal_mobile"),
  accountsName: text("accounts_name"),
  accountsMobile: text("accounts_mobile"),
  programmeInChargeName: text("programme_in_charge_name"),
  programmeInChargeMobile: text("programme_in_charge_mobile"),
  
  // Page 4: Dispatch Details
  deliveryDate: timestamp("delivery_date"),
  preferredTransport1: text("preferred_transport_1"),
  preferredTransport2: text("preferred_transport_2"),
  
  // Book Order Data (Pages 5-11 stored as JSONB for flexibility)
  items: jsonb("items").notNull().default({}),
  
  // Page 12: Estimated Invoice & Totals
  totalAmount: text("total_amount").default("0").notNull(),
  totalDiscount: text("total_discount").default("0").notNull(),
  netAmount: text("net_amount").default("0").notNull(),
  advancePayment: text("advance_payment"),
  firstInstalment: text("first_instalment"),
  secondInstalment: text("second_instalment"),
  
  // Dispatch & Tracking
  dispatchId: text("dispatch_id"),
  status: text("status").default("pending"), // 'pending', 'dispatched', 'delivered'
  
  // Shareable Link
  shareToken: text("share_token").unique(),
  isPublicFilled: boolean("is_public_filled").default(false),

  createdAt: timestamp("created_at").defaultNow(),
});

export const supportRequests = pgTable("support_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  items: jsonb("items").notNull().default([]), // Selected products/items
  remarks: text("remarks"), // max 250 words
  adminResponse: text("admin_response"),
  status: text("status").default("pending"), // 'pending', 'resolved'
  createdAt: timestamp("created_at").defaultNow(),
});

export const dispatches = pgTable("dispatches", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  executiveId: integer("executive_id").notNull().references(() => users.id),
  dispatchDate: timestamp("dispatch_date").notNull(),
  bookType: text("book_type").notNull(), // 'Sales' / 'Sample'
  modeOfParcel: text("mode_of_parcel").notNull(), // e.g., 'SINDHU PARCEL SERVICE'
  lrNo: text("lr_no").notNull(),
  noOfBox: integer("no_of_box").notNull(),
  ref: text("ref"),
  remarks: text("remarks"), // max 200 words
  status: text("status").default("Not Delivered"), // 'Received' / 'Not Delivered'
  createdAt: timestamp("created_at").defaultNow(),
});

export const packingLists = pgTable("packing_lists", {
  id: serial("id").primaryKey(),
  dispatchId: integer("dispatch_id").notNull().references(() => dispatches.id),
  items: jsonb("items").notNull().default([]), // List of items with quantities
  remarks: text("remarks"), // max 250 words
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupportRequestSchema = createInsertSchema(supportRequests, {
  items: z.array(z.any()),
}).omit({ id: true, createdAt: true, userId: true });

export const insertDispatchSchema = createInsertSchema(dispatches, {
  dispatchDate: z.coerce.date(),
}).omit({ id: true, createdAt: true, adminId: true });

export const insertPackingListSchema = createInsertSchema(packingLists, {
  items: z.array(z.any()),
}).omit({ id: true, createdAt: true });

export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;
export type Dispatch = typeof dispatches.$inferSelect;
export type InsertDispatch = z.infer<typeof insertDispatchSchema>;
export type PackingList = typeof packingLists.$inferSelect;
export type InsertPackingList = z.infer<typeof insertPackingListSchema>;


export const insertOrderSchema = createInsertSchema(orders, {
  deliveryDate: z.coerce.date().optional().nullable(),
  items: z.record(z.any()),
  totalAmount: z.string().optional(),
  totalDiscount: z.string().optional(),
  netAmount: z.string().optional(),
  dispatchId: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  shareToken: z.string().optional().nullable(),
  isPublicFilled: z.boolean().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type Order = typeof orders.$inferSelect & { userName?: string };
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertVisitSchema = createInsertSchema(visits, {
  visitDate: z.coerce.date(),
  followUpDate: z.coerce.date().optional().nullable(),
  booksSubmitted: z.array(z.string()).optional().nullable(),
  products: z.array(z.string()).optional().nullable(),
  photoUrl: z.string().min(1, "Visit photo is required").default(""),
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
