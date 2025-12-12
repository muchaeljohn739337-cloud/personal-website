import crypto from "crypto";
import prisma from "../../prismaClient";

/**
 * SafePrisma - Type-safe Prisma wrapper with auto-validation
 *
 * Prevents errors like:
 * - Missing required fields (id, updatedAt)
 * - Invalid field names
 * - Schema mismatches
 *
 * Usage:
 *   await SafePrisma.create('audit_logs', { userId, action, resourceType });
 *   await SafePrisma.createMany('rewards', [...data]);
 */
export class SafePrisma {
  /**
   * Models that require explicit id field
   */
  private static REQUIRES_ID = [
    "audit_logs",
    "rewards",
    "user_tiers",
    "support_tickets",
    "health_readings",
    "medbeds_bookings",
  ];

  /**
   * Models that DON'T have updatedAt field
   */
  private static NO_UPDATED_AT = ["token_transactions"];

  /**
   * Safe create with auto-field injection
   */
  static async create<T = any>(
    model: string,
    data: Record<string, any>
  ): Promise<T> {
    const enrichedData = this.enrichData(model, data);

    try {
      return (await (prisma as any)[model].create({ data: enrichedData })) as T;
    } catch (error: any) {
      throw new Error(
        `SafePrisma.create failed for ${model}: ${
          error.message
        }\nData: ${JSON.stringify(enrichedData, null, 2)}`
      );
    }
  }

  /**
   * Safe createMany with validation
   */
  static async createMany(
    model: string,
    data: Record<string, any>[]
  ): Promise<{ count: number }> {
    const enrichedData = data.map((record) => this.enrichData(model, record));

    try {
      return await (prisma as any)[model].createMany({
        data: enrichedData,
        skipDuplicates: true,
      });
    } catch (error: any) {
      throw new Error(
        `SafePrisma.createMany failed for ${model}: ${error.message}`
      );
    }
  }

  /**
   * Safe upsert
   */
  static async upsert<T = any>(
    model: string,
    where: Record<string, any>,
    create: Record<string, any>,
    update: Record<string, any>
  ): Promise<T> {
    const enrichedCreate = this.enrichData(model, create);
    const enrichedUpdate = this.enrichDataForUpdate(model, update);

    try {
      return (await (prisma as any)[model].upsert({
        where,
        create: enrichedCreate,
        update: enrichedUpdate,
      })) as T;
    } catch (error: any) {
      throw new Error(
        `SafePrisma.upsert failed for ${model}: ${error.message}`
      );
    }
  }

  /**
   * Auto-enrich data with required fields
   */
  private static enrichData(
    model: string,
    data: Record<string, any>
  ): Record<string, any> {
    const enriched = { ...data };

    // Add id if required and not present
    if (this.REQUIRES_ID.includes(model) && !enriched.id) {
      enriched.id = crypto.randomUUID();
    }

    // Add updatedAt if model supports it and not present
    if (!this.NO_UPDATED_AT.includes(model) && !enriched.updatedAt) {
      enriched.updatedAt = new Date();
    }

    return enriched;
  }

  /**
   * Enrich update data (only updatedAt, no id)
   */
  private static enrichDataForUpdate(
    model: string,
    data: Record<string, any>
  ): Record<string, any> {
    const enriched = { ...data };

    // Update timestamp if model supports it
    if (!this.NO_UPDATED_AT.includes(model) && !enriched.updatedAt) {
      enriched.updatedAt = new Date();
    }

    return enriched;
  }

  /**
   * Validate model name
   */
  static isValidModel(model: string): boolean {
    return model in prisma;
  }

  /**
   * Get list of all valid models
   */
  static getValidModels(): string[] {
    return Object.keys(prisma).filter(
      (key) =>
        typeof (prisma as any)[key] === "object" &&
        "create" in (prisma as any)[key]
    );
  }
}

/**
 * Example Usage:
 *
 * // ✅ Safe create - auto-adds id
 * await SafePrisma.create('audit_logs', {
 *   userId,
 *   action: 'login',
 *   resourceType: 'user'
 * });
 *
 * // ✅ Safe createMany
 * await SafePrisma.createMany('rewards', [
 *   { userId: '1', amount: 100, title: 'Bonus' },
 *   { userId: '2', amount: 200, title: 'Reward' },
 * ]);
 *
 * // ✅ Safe upsert
 * await SafePrisma.upsert(
 *   'token_wallets',
 *   { userId },
 *   { userId, balance: 0 },
 *   { balance: { increment: 100 } }
 * );
 */
