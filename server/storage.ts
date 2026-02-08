
import { db, pool } from "./db.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { 
  users, visits, targets, sampleSubmissions,
  type User, type InsertUser, 
  type Visit, type InsertVisit,
  type Target, type InsertTarget,
  type SampleSubmission, type InsertSampleSubmission
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

  // Samples
  createSampleSubmission(sample: InsertSampleSubmission & { userId: number }): Promise<SampleSubmission>;
  listSampleSubmissions(): Promise<SampleSubmission[]>;

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

  async createSampleSubmission(sample: InsertSampleSubmission & { userId: number }): Promise<SampleSubmission> {
    const [newSample] = await db.insert(sampleSubmissions).values(sample).returning();
    return newSample;
  }

  async listSampleSubmissions(): Promise<SampleSubmission[]> {
    return await db.select().from(sampleSubmissions).orderBy(desc(sampleSubmissions.createdAt));
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

  async createVisit(visit: any): Promise<Visit> {
    const { booksSubmitted, products, visitDate, followUpDate, samplePhotoUrl, ...rest } = visit;
    
    // Ensure dates are actual Date objects for Drizzle/node-postgres
    const vDate = visitDate instanceof Date ? visitDate : (visitDate ? new Date(visitDate) : new Date());
    const fDate = followUpDate instanceof Date ? followUpDate : (followUpDate ? new Date(followUpDate) : null);

    const [newVisit] = await db.insert(visits).values({
      ...rest,
      visitDate: vDate,
      followUpDate: fDate,
      booksSubmitted: booksSubmitted || [],
      products: products || [],
      samplePhotoUrl: samplePhotoUrl || null,
    }).returning();
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
      const start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      conditions.push(gte(visits.visitDate, start));
    }
    
    if (filter?.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(visits.visitDate, end));
    }

    console.log("Listing visits with conditions:", conditions.length);
    const result = await db.select()
      .from(visits)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(visits.visitDate));
    console.log("Found visits:", result.length);
    return result;
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

  async updateVisitFollowUp(id: number, adminFollowUp: string): Promise<Visit> {
    const [updatedVisit] = await db
      .update(visits)
      .set({ 
        adminFollowUp,
        adminFollowUpStatus: 'pending'
      })
      .where(eq(visits.id, id))
      .returning();
    return updatedVisit;
  }

  async completeVisitFollowUp(id: number): Promise<Visit> {
    const [updatedVisit] = await db
      .update(visits)
      .set({ adminFollowUpStatus: 'completed' })
      .where(eq(visits.id, id))
      .returning();
    return updatedVisit;
  }
}

export const storage = new DatabaseStorage();
