
import { db, pool } from "./db.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { 
  users, visits, targets, sampleSubmissions, leaves, orders,
  supportRequests, dispatches, packingLists,
  type User, type InsertUser, 
  type Visit, type InsertVisit,
  type Target, type InsertTarget,
  type SampleSubmission, type InsertSampleSubmission,
  type Leave, type InsertLeave,
  type Order, type InsertOrder,
  type SupportRequest, type InsertSupportRequest,
  type Dispatch, type InsertDispatch,
  type PackingList, type InsertPackingList
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
  updateUserPassword(id: number, password: string): Promise<User>;
  
  // Leaves
  createLeave(leave: InsertLeave & { userId: number }): Promise<Leave>;
  listLeaves(filter?: { userId?: number }): Promise<Leave[]>;

  // Orders
  createOrder(order: InsertOrder & { userId: number }): Promise<Order>;
  listOrders(filter?: { userId?: number }): Promise<(Order & { userName?: string })[]>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string, dispatchId?: string): Promise<Order>;
  updateOrderPublic(id: number, data: Partial<Order>): Promise<Order>;
  getOrderByToken(token: string): Promise<Order | undefined>;

  // Support Requests
  createSupportRequest(request: InsertSupportRequest & { userId: number }): Promise<SupportRequest>;
  listSupportRequests(filter?: { userId?: number; orderId?: number }): Promise<SupportRequest[]>;
  updateSupportRequest(id: number, data: Partial<SupportRequest>): Promise<SupportRequest>;

  // Dispatches
  createDispatch(dispatch: InsertDispatch & { adminId: number }): Promise<Dispatch>;
  listDispatches(filter?: { executiveId?: number; date?: Date }): Promise<Dispatch[]>;
  updateDispatchStatus(id: number, status: string): Promise<Dispatch>;

  // Packing Lists
  createPackingList(list: InsertPackingList): Promise<PackingList>;
  getPackingListByDispatch(dispatchId: number): Promise<PackingList | undefined>;

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

  async createOrder(order: InsertOrder & { userId: number }): Promise<Order> {
    const { items, ...rest } = order;
    const [newOrder] = await db.insert(orders).values([{
      ...rest,
      userId: order.userId,
      items: items || {},
      shareToken: order.shareToken || (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
      isPublicFilled: order.isPublicFilled ?? false
    }]).returning();
    return newOrder;
  }

  async listOrders(filter?: { userId?: number }): Promise<(Order & { userName?: string })[]> {
    let conditions = [];
    if (filter?.userId) {
      conditions.push(eq(orders.userId, filter.userId));
    }
    
    const results = await db.select({
      order: orders,
      userName: users.name
    })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));

    return results.map(r => ({
      ...r.order,
      userName: r.userName || undefined
    }));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(id: number, status: string, dispatchId?: string): Promise<Order> {
    const updateData: any = { status };
    if (dispatchId !== undefined) {
      updateData.dispatchId = dispatchId;
    }
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    if (!updatedOrder) throw new Error("Order not found");
    
    // If order is dispatched, also update any linked support requests
    if (status === 'dispatched' && dispatchId) {
      await db.update(supportRequests)
        .set({ status: 'dispatched', dispatchId })
        .where(eq(supportRequests.id, id)); // Assuming 1:1 or linked by ID for this logic
    }
    
    return updatedOrder;
  }

  async updateOrderPublic(id: number, data: Partial<Order>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...data, isPublicFilled: true })
      .where(eq(orders.id, id))
      .returning();
    if (!updatedOrder) throw new Error("Order not found");
    return updatedOrder;
  }

  async getOrderByToken(token: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.shareToken, token));
    return order;
  }

  // Support Requests
  async createSupportRequest(request: InsertSupportRequest & { userId: number }): Promise<SupportRequest> {
    const { items, ...rest } = request;
    const [newRequest] = await db.insert(supportRequests).values({
      ...rest,
      userId: request.userId,
      items: items || [],
    }).returning();
    return newRequest;
  }

  async listSupportRequests(filter?: { userId?: number }): Promise<SupportRequest[]> {
    let conditions = [];
    if (filter?.userId) conditions.push(eq(supportRequests.userId, filter.userId));
    return await db.select().from(supportRequests).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(supportRequests.createdAt));
  }

  async updateSupportRequest(id: number, data: Partial<SupportRequest>): Promise<SupportRequest> {
    const [updated] = await db.update(supportRequests).set(data).where(eq(supportRequests.id, id)).returning();
    if (!updated) throw new Error("Support request not found");
    return updated;
  }

  // Dispatches
  async createDispatch(dispatch: InsertDispatch & { adminId: number }): Promise<Dispatch> {
    const [newDispatch] = await db.insert(dispatches).values({
      ...dispatch,
      adminId: dispatch.adminId,
    }).returning();
    return newDispatch;
  }

  async listDispatches(filter?: { executiveId?: number; date?: Date }): Promise<Dispatch[]> {
    let conditions = [];
    if (filter?.executiveId) conditions.push(eq(dispatches.executiveId, filter.executiveId));
    if (filter?.date) {
      const start = new Date(filter.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filter.date);
      end.setHours(23, 59, 59, 999);
      conditions.push(and(gte(dispatches.dispatchDate, start), lte(dispatches.dispatchDate, end)));
    }
    return await db.select().from(dispatches).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(dispatches.dispatchDate));
  }

  async updateDispatchStatus(id: number, status: string): Promise<Dispatch> {
    const [updated] = await db.update(dispatches).set({ status }).where(eq(dispatches.id, id)).returning();
    if (!updated) throw new Error("Dispatch not found");

    // If dispatch is marked as delivered, update linked orders/requests
    if (status === 'delivered') {
      await db.update(orders)
        .set({ status: 'delivered' })
        .where(eq(orders.dispatchId, updated.lrNo)); // Using lrNo as the reference
      
      await db.update(supportRequests)
        .set({ status: 'delivered' })
        .where(eq(supportRequests.dispatchId, updated.lrNo));
    }

    return updated;
  }

  // Packing Lists
  async createPackingList(list: InsertPackingList): Promise<PackingList> {
    const [newList] = await db.insert(packingLists).values(list).returning();
    return newList;
  }

  async getPackingListByDispatch(dispatchId: number): Promise<PackingList | undefined> {
    const [list] = await db.select().from(packingLists).where(eq(packingLists.dispatchId, dispatchId));
    return list;
  }

  async updateUserPassword(id: number, password: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async createSampleSubmission(sample: InsertSampleSubmission & { userId: number }): Promise<SampleSubmission> {
    const [newSample] = await db.insert(sampleSubmissions).values(sample).returning();
    return newSample;
  }

  async listSampleSubmissions(): Promise<SampleSubmission[]> {
    return [];
  }

  async createLeave(leave: InsertLeave & { userId: number }): Promise<Leave> {
    const [newLeave] = await db.insert(leaves).values(leave).returning();
    return newLeave;
  }

  async listLeaves(filter?: { userId?: number }): Promise<Leave[]> {
    let conditions = [];
    if (filter?.userId) {
      conditions.push(eq(leaves.userId, filter.userId));
    }
    return await db.select()
      .from(leaves)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(leaves.createdAt));
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
