
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { db } from "./db.js";
import { users, visits, insertVisitSchema } from "../shared/schema.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

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
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      return uploadDir;
    }
    return uploadDir;
  } catch (e) {
    const tmpPath = "/tmp/uploads";
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }
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
    proxy: true,
    cookie: { 
      secure: true,
      sameSite: "none"
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

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

  // --- Visit Routes ---
  
  // Create Visit
  app.post(api.visits.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.visits.create.input.parse(req.body);
      const visit = await storage.createVisit({
        ...input,
        userId: (req.user as any).id
      });
      res.status(201).json(visit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
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
  app.post(api.upload.create.path, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    // Return relative URL
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
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

  return httpServer;
}
