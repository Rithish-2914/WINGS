
import { db } from "./db.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { 
  users, visits, 
  type User, type InsertUser, 
  type Visit, type InsertVisit 
} from "@shared/schema.js";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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

  async listVisits(filter?: { userId?: number, startDate?: Date, endDate?: Date }): Promise<Visit[]> {
    let conditions = [];
    
    if (filter?.userId) {
      conditions.push(eq(visits.userId, filter.userId));
    }
    
    if (filter?.startDate) {
      conditions.push(gte(visits.visitDate, filter.startDate));
    }
    
    if (filter?.endDate) {
      conditions.push(lte(visits.visitDate, filter.endDate));
    }

    return await db.select()
      .from(visits)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(visits.visitDate));
  }
}

export const storage = new DatabaseStorage();
