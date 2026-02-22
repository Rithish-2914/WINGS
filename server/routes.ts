
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { db } from "./db.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { 
  users, visits, insertVisitSchema, targets, 
  insertSampleSubmissionSchema, sampleSubmissions, leaves, 
  insertLeaveSchema, orders, insertOrderSchema,
  supportRequests, insertSupportRequestSchema,
  dispatches, insertDispatchSchema,
  packingLists, insertPackingListSchema
} from "../shared/schema.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const visitBucket = process.env.SUPABASE_BUCKET_NAME || "school-visit-photos";
const sampleBucket = "samples"; // Dedicated bucket for samples as per supabase.md

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

if (!supabase) {
  console.warn("Supabase credentials missing. Falling back to local storage for uploads.");
}

// Ensure uploads directory exists (safely for different environments)
const uploadDir = path.join(process.cwd(), "uploads");
try {
  // Use a fallback to /tmp/uploads if the local directory is read-only (common in serverless/production)
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (mkdirErr) {
      console.warn("Could not create local uploads directory, falling back to /tmp/uploads:", mkdirErr);
      const tmpUploadDir = "/tmp/uploads";
      if (!fs.existsSync(tmpUploadDir)) {
        fs.mkdirSync(tmpUploadDir, { recursive: true });
      }
      // Update uploadDir to point to tmp
      // Note: We'll keep using the constant name but point it elsewhere
    }
  }
} catch (err) {
  console.error("Critical error setting up uploads directory:", err);
}

// Final check/fallback for the actual directory path used by multer
const finalUploadDir = (function() {
  console.log("process.cwd():", process.cwd());
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log("Using uploadDir:", uploadDir);
    return uploadDir;
  } catch (e) {
    const tmpPath = "/tmp/uploads";
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }
    console.log("Falling back to tmpPath:", tmpPath);
    return tmpPath;
  }
})();

// Multer setup for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, finalUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Serve uploaded files statically
  app.use("/uploads", express.static(finalUploadDir));

  // --- Auth Setup ---
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) { // Simple password check for now (as requested 123abc)
        return done(null, false, { message: "Invalid credentials" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.use(session({
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to false for local development/non-HTTPS
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // --- Order Routes ---
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const data = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder({
        ...data,
        userId: (req.user as any).id
      });
      res.status(201).json(order);
    } catch (err) {
      console.error("Error creating order:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error", error: String(err) });
      }
    }
  });

  app.post("/api/orders/share", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const token = Math.random().toString(36).substring(2, 15);
      const order = await storage.createOrder({
        userId: (req.user as any).id,
        schoolName: "Pending Link Order",
        items: {},
        shareToken: token,
        isPublicFilled: false
      });
      res.status(201).json(order);
    } catch (err) {
      console.error("Error creating share link:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/public/:token", async (req, res) => {
    try {
      const { token } = req.params;
      console.log("Fetching public order for token:", token);
      const order = await storage.getOrderByToken(token);
      if (!order) {
        console.log("Order not found for token:", token);
        return res.status(404).json({ message: "Order link invalid or expired" });
      }
      res.json(order);
    } catch (err) {
      console.error("Error fetching public order:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/orders/public/:token", async (req, res) => {
    try {
      const order = await storage.getOrderByToken(req.params.token);
      if (!order) return res.status(404).json({ message: "Order link invalid or expired" });
      
      const data = insertOrderSchema.parse(req.body);
      const updated = await storage.updateOrderPublic(order.id, data);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    let userIdFilter = user.role === 'admin' ? undefined : user.id;
    const ordersList = await storage.listOrders({ userId: userIdFilter });
    res.json(ordersList);
  });

  // --- Support Routes ---
  app.post("/api/support", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      console.log("Creating support request with body:", JSON.stringify(req.body));
      const { items, ...rest } = req.body;
      const data = insertSupportRequestSchema.parse({
        ...rest,
        items: Array.isArray(items) ? items : []
      });
      const request = await storage.createSupportRequest({
        ...data,
        userId: (req.user as any).id
      });
      res.status(201).json(request);
    } catch (err) {
      console.error("Error creating support request:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, errors: err.errors });
      } else {
        res.status(500).json({ message: "Internal server error", error: String(err) });
      }
    }
  });

  app.get("/api/support", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const filter = user.role === 'admin' ? {} : { userId: user.id };
    const requests = await storage.listSupportRequests(filter);
    res.json(requests);
  });

  app.patch("/api/support/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== 'admin') return res.sendStatus(403);
    try {
      const updated = await storage.updateSupportRequest(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/support/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { status } = req.body;
      const updated = await storage.updateSupportRequest(Number(req.params.id), { status });
      res.json(updated);
    } catch (err) {
      console.error("Error updating support status:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Dispatch & Packing List Routes ---
  app.post("/api/dispatches", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== 'admin') return res.sendStatus(403);
    try {
      const data = insertDispatchSchema.parse(req.body);
      const dispatch = await storage.createDispatch({
        ...data,
        adminId: user.id
      });
      res.status(201).json(dispatch);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/dispatches", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const executiveId = user.role === 'executive' ? user.id : (req.query.executiveId ? Number(req.query.executiveId) : undefined);
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    const dispatches = await storage.listDispatches({ executiveId, date });
    res.json(dispatches);
  });

  app.post("/api/packing-lists", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== 'admin') return res.sendStatus(403);
    try {
      const data = insertPackingListSchema.parse(req.body);
      const list = await storage.createPackingList(data);
      res.status(201).json(list);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/dispatches/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { status } = req.body;
      const updated = await storage.updateDispatchStatus(Number(req.params.id), status);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/packing-lists/:dispatchId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const list = await storage.getPackingListByDispatch(Number(req.params.dispatchId));
    if (!list) return res.status(404).json({ message: "Packing list not found" });
    res.json(list);
  });

  app.patch("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });

      const user = req.user as any;
      if (user.role !== 'admin' && order.userId !== user.id) {
        return res.sendStatus(403);
      }

      const updated = await storage.updateOrderPublic(order.id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    const user = req.user as any;
    if (user.role !== 'admin' && order.userId !== user.id) {
      return res.sendStatus(403);
    }
    res.json(order);
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { status, dispatchId, courierMode } = req.body;
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });

      const user = req.user as any;
      // Admin can update status, dispatchId, and courierMode
      // Executive can only update to 'delivered' if currently 'dispatched'
      if (user.role === 'admin') {
        const updated = await storage.updateOrderStatus(order.id, status, dispatchId, courierMode);
        return res.json(updated);
      } else if (user.role === 'executive' && order.userId === user.id) {
        if (status === 'delivered') {
          const updated = await storage.updateOrderStatus(order.id, 'delivered');
          return res.json(updated);
        }
        return res.sendStatus(403);
      }
      return res.sendStatus(403);
    } catch (err) {
      console.error("Error updating order status:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Auth Routes ---
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // --- User Routes ---
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== 'admin') return res.sendStatus(403);
    
    const allUsers = await db.select().from(users);
    // Don't send passwords
    res.json(allUsers.map(({ password, ...rest }) => rest));
  });

  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (currentUser.role !== 'admin') return res.sendStatus(403);

    try {
      const { username, password, name, role } = req.body;
      
      // Basic validation
      if (!username || !password || !name) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const newUser = await storage.createUser({
        username,
        password,
        name,
        role: role || 'executive'
      });

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (currentUser.role !== 'admin') return res.sendStatus(403);

    const userIdToDelete = Number(req.params.id);
    if (userIdToDelete === currentUser.id) {
      return res.status(400).json({ message: "Cannot delete your own admin account" });
    }

    try {
      // First, delete related visits
      await db.delete(visits).where(eq(visits.userId, userIdToDelete));
      // Finally, delete the user
      await db.delete(users).where(eq(users.id, userIdToDelete));
      res.sendStatus(200);
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (currentUser.role !== 'admin') return res.sendStatus(403);

    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      await storage.updateUserPassword(Number(req.params.id), password);
      res.sendStatus(200);
    } catch (err) {
      console.error("Error updating password:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Visit Routes ---
  
  // Create Visit
  app.post(api.visits.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      console.log("Creating visit with body:", req.body);
      // Clean the input to match schema expectations
      const cleanedBody = { ...req.body };
      
      // Ensure visitDate is a Date object if provided as string
      if (typeof cleanedBody.visitDate === 'string') {
        cleanedBody.visitDate = new Date(cleanedBody.visitDate);
      }
      
      // Ensure followUpDate is a Date object if provided as string
      if (typeof cleanedBody.followUpDate === 'string') {
        cleanedBody.followUpDate = new Date(cleanedBody.followUpDate);
      } else if (cleanedBody.followUpDate === "") {
        cleanedBody.followUpDate = null;
      }

      // Map phoneNumber to schoolPhone for legacy/schema consistency if schoolPhone is missing
      if (!cleanedBody.schoolPhone && cleanedBody.phoneNumber) {
        cleanedBody.schoolPhone = cleanedBody.phoneNumber;
      }

      const input = api.visits.create.input.parse(cleanedBody);
      const visit = await storage.createVisit({
        ...input,
        userId: (req.user as any).id
      });
      res.status(201).json(visit);
    } catch (err: any) {
      // Use a safe way to log error to avoid util.inspect issues
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error creating visit:", errorMessage);
      
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      } else {
        res.status(500).json({ message: "Internal server error", error: String(err) });
      }
    }
  });

  // List Visits
  app.get(api.visits.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Admins can see all, Execs only see their own (unless filter is provided by admin?)
    // For MVP: Admin sees all, Exec sees own.
    
    const user = req.user as any;
    let userIdFilter = user.role === 'admin' ? undefined : user.id;

    // Allow admin to filter by specific user if provided in query
    if (user.role === 'admin' && req.query.userId) {
        userIdFilter = Number(req.query.userId);
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const visits = await storage.listVisits({
      userId: userIdFilter,
      startDate,
      endDate
    });
    res.json(visits);
  });

  // Get Single Visit
  app.get(api.visits.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const visit = await storage.getVisit(Number(req.params.id));
    if (!visit) return res.status(404).json({ message: "Not found" });
    
    // Check ownership if not admin
    const user = req.user as any;
    if (user.role !== 'admin' && visit.userId !== user.id) {
      return res.sendStatus(403);
    }
    
    res.json(visit);
  });

  // Delete Visit (Admin only)
  app.delete("/api/visits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== 'admin') return res.sendStatus(403);
    
    try {
      await storage.deleteVisit(Number(req.params.id));
      res.sendStatus(200);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/visits/:id/follow-up", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== 'admin') return res.sendStatus(403);

    try {
      const { adminFollowUp } = req.body;
      if (!adminFollowUp) {
        return res.status(400).json({ message: "Remark is required" });
      }

      const updatedVisit = await (storage as any).updateVisitFollowUp(
        Number(req.params.id),
        adminFollowUp
      );
      res.json(updatedVisit);
    } catch (err) {
      console.error("Error updating follow-up:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/visits/:id/complete-follow-up", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const visit = await storage.getVisit(Number(req.params.id));
      if (!visit) return res.status(404).json({ message: "Visit not found" });
      
      const user = req.user as any;
      if (user.role !== 'admin' && visit.userId !== user.id) {
        return res.sendStatus(403);
      }

      const updatedVisit = await (storage as any).completeVisitFollowUp(Number(req.params.id));
      res.json(updatedVisit);
    } catch (err) {
      console.error("Error completing follow-up:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Target Routes ---
  app.post("/api/targets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== 'admin') return res.sendStatus(403);
    
    try {
      const target = await storage.createTarget({
        ...req.body,
        adminId: user.id
      });
      res.status(201).json(target);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/targets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const executiveId = req.query.executiveId ? Number(req.query.executiveId) : (user.role === 'executive' ? user.id : undefined);
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    
    const targets = await storage.listTargets({ executiveId, date });
    res.json(targets);
  });

  // --- Upload Route ---
  app.post(api.upload.create.path, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Determine target bucket based on request header or query param if needed
    // For now, default to visits or detect from context if possible
    // Using a simple logic: if it's coming from /api/samples flow, we might want to use sampleBucket
    const targetBucket = req.headers['x-bucket-name'] === 'samples' ? sampleBucket : visitBucket;

    if (supabase) {
      try {
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
        const filePath = fileName;

        const fileContent = fs.readFileSync(req.file.path);
        
        const { data, error } = await supabase.storage
          .from(targetBucket)
          .upload(filePath, fileContent, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (error) {
          console.error(`Supabase storage error in bucket ${targetBucket}:`, error);
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(filePath);

        console.log(`Supabase upload success to ${targetBucket}. Public URL:`, publicUrl);

        // Clean up local file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.json({ url: publicUrl });
      } catch (err: any) {
        console.error("Supabase upload process error:", err);
        // Fallback to local if Supabase fails
        const url = `/uploads/${req.file.filename}`;
        res.json({ url });
      }
    } else {
      // Return relative URL for local storage
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    }
  });

  // Seed Data (if empty)
  // We'll create the user "1001" / "123abc" if it doesn't exist
  if (await storage.getUserByUsername("1001") === undefined) {
    await storage.createUser({
      username: "1001",
      password: "123abc",
      name: "Sales Executive 1",
      role: "executive"
    });
    console.log("Seeded executive user: 1001 / 123abc");
  }
  
  if (await storage.getUserByUsername("admin") === undefined) {
    await storage.createUser({
      username: "admin",
      password: "admin123",
      name: "Administrator",
      role: "admin"
    });
    console.log("Seeded admin user: admin / admin123");
  }

  // Sample Submissions
  app.post("/api/samples", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      // Mock or adjust based on your needs since sample_submissions table is missing
      res.status(201).json({ message: "Feature temporarily disabled or pending schema sync" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/samples", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") {
      return res.sendStatus(403);
    }
    const samples = await storage.listSampleSubmissions();
    res.json(samples);
  });

  // --- Leave Routes ---
  app.post("/api/leaves", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const data = insertLeaveSchema.parse(req.body);
      const leave = await storage.createLeave({
        ...data,
        userId: (req.user as any).id
      });
      res.status(201).json(leave);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/leaves", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    
    let userIdFilter = user.role === 'admin' ? undefined : user.id;
    if (user.role === 'admin' && req.query.userId) {
      userIdFilter = Number(req.query.userId);
    }

    const leavesList = await storage.listLeaves({ userId: userIdFilter });
    res.json(leavesList);
  });

  return httpServer;
}
