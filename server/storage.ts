
import { db, pool } from "./db.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { 
  users, visits, targets,
  type User, type InsertUser, 
  type Visit, type InsertVisit,
  type Target, type InsertTarget
} from "../shared/schema.js";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Visits
  createVisit(visit: InsertVisit & { userId: number }): Promise<Visit>;
  getVisit(id: number): Promise<Visit | undefined>;
  listVisits(filter?: { userId?: number, startDate?: Date, endDate?: Date }): Promise<Visit[]>;
  deleteVisit(id: number): Promise<void>;
  
  // Targets
  createTarget(target: InsertTarget & { adminId: number }): Promise<Target>;
  listTargets(filter?: { executiveId?: number, date?: Date }): Promise<Target[]>;

  // Session Store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createVisit(visit: InsertVisit & { userId: number }): Promise<Visit> {
    const [newVisit] = await db.insert(visits).values(visit).returning();
    return newVisit;
  }

  async getVisit(id: number): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit;
  }

  async deleteVisit(id: number): Promise<void> {
    await db.delete(visits).where(eq(visits.id, id));
  }

  async listVisits(filter?: { userId?: number, startDate?: Date, endDate?: Date }): Promise<Visit[]> {
    let conditions = [];
    
    if (filter?.userId) {
      conditions.push(eq(visits.userId, filter.userId));
    }
    
    if (filter?.startDate) {
      // Set to start of day
      const start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      conditions.push(gte(visits.visitDate, start));
    }
    
    if (filter?.endDate) {
      // Set to end of day
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(visits.visitDate, end));
    }

    return await db.select()
      .from(visits)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(visits.visitDate));
  }

  async createTarget(target: InsertTarget & { adminId: number }): Promise<Target> {
    const [newTarget] = await db.insert(targets).values(target).returning();
    return newTarget;
  }

  async listTargets(filter?: { executiveId?: number, date?: Date }): Promise<Target[]> {
    let conditions = [];
    if (filter?.executiveId) {
      conditions.push(eq(targets.executiveId, filter.executiveId));
    }
    if (filter?.date) {
      const start = new Date(filter.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filter.date);
      end.setHours(23, 59, 59, 999);
      conditions.push(and(gte(targets.targetDate, start), lte(targets.targetDate, end)));
    }
    return await db.select()
      .from(targets)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(targets.targetDate));
  }
}

export const storage = new DatabaseStorage();
