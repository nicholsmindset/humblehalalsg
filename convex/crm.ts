import {
  internalMutationGeneric,
  mutationGeneric,
  queryGeneric,
  type GenericMutationCtx,
  type GenericQueryCtx,
  type GenericDataModel,
} from "convex/server";
import { v, type GenericId, type Value } from "convex/values";

type Ctx = GenericQueryCtx<GenericDataModel> | GenericMutationCtx<GenericDataModel>;
type Json = Record<string, unknown>;

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function bool(value: unknown): boolean {
  return value === true;
}

async function requireAdmin(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  const claims = identity as unknown as Record<string, unknown>;
  const publicMetadata = claims.publicMetadata ?? claims.public_metadata;
  const metadataRole = publicMetadata && typeof publicMetadata === "object"
    ? (publicMetadata as Record<string, unknown>).role
    : undefined;
  const role = claims.role ?? metadataRole;
  const allowList = (process.env.CRM_ADMIN_USER_IDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (role !== "admin" && !allowList.includes(identity.subject)) throw new Error("Forbidden");
  return identity;
}

async function oneBySource(ctx: GenericMutationCtx<GenericDataModel>, table: string, sourceId: string) {
  return ctx.db.query(table).withIndex("by_source_id", (q) => q.eq("sourceId", sourceId)).unique();
}

async function removeBySource(ctx: GenericMutationCtx<GenericDataModel>, table: string, sourceId: string) {
  const existing = await oneBySource(ctx, table, sourceId);
  if (existing) await ctx.db.delete(existing._id as GenericId<string>);
}

async function upsertBySource(
  ctx: GenericMutationCtx<GenericDataModel>,
  table: string,
  sourceId: string,
  value: Record<string, unknown>,
) {
  const existing = await oneBySource(ctx, table, sourceId);
  const convexValue = value as Record<string, Value | undefined>;
  if (existing) await ctx.db.patch(existing._id as GenericId<string>, convexValue);
  else await ctx.db.insert(table, { sourceId, ...convexValue });
}

const ingestArgs = {
  eventId: v.string(),
  eventType: v.union(v.literal("upsert"), v.literal("delete")),
  aggregateType: v.union(v.literal("business"), v.literal("lead"), v.literal("lead_route")),
  aggregateId: v.string(),
  occurredAt: v.string(),
  payload: v.any(),
};

export const ingest = internalMutationGeneric({
  args: ingestArgs,
  handler: async (ctx, event) => {
    const duplicate = await ctx.db
      .query("syncEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", event.eventId))
      .unique();
    if (duplicate) return { duplicate: true };

    const version = await ctx.db
      .query("sourceVersions")
      .filter((q) => q.and(
        q.eq(q.field("aggregateType"), event.aggregateType),
        q.eq(q.field("aggregateId"), event.aggregateId),
      ))
      .unique();
    if (version && version.occurredAt > event.occurredAt) {
      await ctx.db.insert("syncEvents", {
        eventId: event.eventId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt,
        receivedAt: Date.now(),
        status: "stale_ignored",
      });
      return { stale: true };
    }

    const payload = event.payload as Json;
    if (event.aggregateType === "business") {
      if (event.eventType === "delete") await removeBySource(ctx, "accounts", event.aggregateId);
      else await upsertBySource(ctx, "accounts", event.aggregateId, {
        name: text(payload.name) ?? "Unnamed business",
        slug: text(payload.slug) ?? event.aggregateId,
        categoryId: text(payload.categoryId),
        area: text(payload.area),
        ownerId: text(payload.ownerId),
        contactEmail: text(payload.contactEmail),
        phone: text(payload.phone),
        plan: text(payload.plan),
        featured: bool(payload.featured),
        sourceCreatedAt: text(payload.createdAt),
        sourceUpdatedAt: event.occurredAt,
      });
    } else if (event.aggregateType === "lead") {
      if (event.eventType === "delete") {
        await removeBySource(ctx, "contacts", event.aggregateId);
        await removeBySource(ctx, "opportunities", event.aggregateId);
      } else {
        const consentContact = bool(payload.consentContact);
        await upsertBySource(ctx, "contacts", event.aggregateId, {
          name: consentContact ? text(payload.name) : undefined,
          email: consentContact ? text(payload.email) : undefined,
          phone: consentContact ? text(payload.phone) : undefined,
          consentContact,
          consentVersion: text(payload.consentVersion),
          consentedAt: text(payload.consentedAt),
          area: text(payload.area),
          sourceUpdatedAt: event.occurredAt,
        });
        const category = text(payload.verticalId) ?? text(payload.category) ?? "General enquiry";
        await upsertBySource(ctx, "opportunities", event.aggregateId, {
          contactSourceId: event.aggregateId,
          title: consentContact && text(payload.name) ? `${category} — ${text(payload.name)}` : `${category} — anonymous lead`,
          stage: text(payload.status) ?? "new",
          category: text(payload.category),
          verticalId: text(payload.verticalId),
          area: text(payload.area),
          budget: text(payload.budget),
          eventDate: text(payload.eventDate),
          sourcePath: text(payload.sourcePath),
          consentContact,
          sourceCreatedAt: text(payload.createdAt),
          routedAt: text(payload.routedAt),
          anonymizedAt: text(payload.anonymizedAt),
          sourceUpdatedAt: event.occurredAt,
        });
      }
    } else {
      if (event.eventType === "delete") await removeBySource(ctx, "assignments", event.aggregateId);
      else await upsertBySource(ctx, "assignments", event.aggregateId, {
        opportunitySourceId: text(payload.leadId) ?? "unknown",
        accountSourceId: text(payload.businessId) ?? "unknown",
        status: text(payload.status) ?? "sent",
        mode: text(payload.mode),
        delivery: text(payload.delivery),
        sentAt: text(payload.sentAt),
        viewedAt: text(payload.viewedAt),
        acceptedAt: text(payload.acceptedAt),
        outcomeAt: text(payload.outcomeAt),
        expiresAt: text(payload.expiresAt),
        deliveredAt: text(payload.deliveredAt),
        sourceUpdatedAt: event.occurredAt,
      });
    }

    if (version) await ctx.db.patch(version._id as GenericId<string>, { occurredAt: event.occurredAt, eventId: event.eventId });
    else await ctx.db.insert("sourceVersions", {
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
      eventId: event.eventId,
    });

    await ctx.db.insert("syncEvents", {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
      receivedAt: Date.now(),
      status: "applied",
    });
    await ctx.db.insert("activities", {
      sourceEventId: event.eventId,
      kind: `source.${event.eventType}`,
      summary: `${event.aggregateType.replace("_", " ")} ${event.eventType}d in Supabase`,
      aggregateType: event.aggregateType,
      aggregateSourceId: event.aggregateId,
      occurredAt: event.occurredAt,
    });
    return { applied: true };
  },
});

export const dashboard = queryGeneric({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [opportunities, accounts, assignments, tasks, notes, activities] = await Promise.all([
      ctx.db.query("opportunities").order("desc").take(500),
      ctx.db.query("accounts").order("desc").take(500),
      ctx.db.query("assignments").order("desc").take(1000),
      ctx.db.query("tasks").order("desc").take(200),
      ctx.db.query("notes").order("desc").take(100),
      ctx.db.query("activities").order("desc").take(30),
    ]);
    const stages: Record<string, number> = {};
    for (const opportunity of opportunities) stages[opportunity.stage] = (stages[opportunity.stage] ?? 0) + 1;
    return { opportunities, accounts, assignments, tasks, notes, activities, stages };
  },
});

export const createTask = mutationGeneric({
  args: {
    title: v.string(),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high")),
    dueAt: v.optional(v.number()),
    opportunitySourceId: v.optional(v.string()),
    accountSourceId: v.optional(v.string()),
    assigneeUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx);
    const title = args.title.trim();
    if (!title || title.length > 160) throw new Error("Invalid task title");
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      ...args,
      title,
      status: "open",
      createdByUserId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("activities", {
      kind: "task.created",
      summary: `Task created: ${title}`,
      aggregateType: "task",
      aggregateSourceId: String(taskId),
      actorUserId: identity.subject,
      occurredAt: new Date(now).toISOString(),
    });
    return taskId;
  },
});

export const setTaskStatus = mutationGeneric({
  args: { taskId: v.id("tasks"), status: v.union(v.literal("open"), v.literal("done"), v.literal("cancelled")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.taskId, { status: args.status, updatedAt: Date.now() });
  },
});

export const addNote = mutationGeneric({
  args: {
    body: v.string(),
    opportunitySourceId: v.optional(v.string()),
    accountSourceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx);
    const body = args.body.trim();
    if (!body || body.length > 5000) throw new Error("Invalid note");
    const now = Date.now();
    const noteId = await ctx.db.insert("notes", { ...args, body, authorUserId: identity.subject, createdAt: now, updatedAt: now });
    await ctx.db.insert("activities", {
      kind: "note.created",
      summary: "A private CRM note was added",
      aggregateType: args.opportunitySourceId ? "lead" : "business",
      aggregateSourceId: args.opportunitySourceId ?? args.accountSourceId ?? String(noteId),
      actorUserId: identity.subject,
      occurredAt: new Date(now).toISOString(),
    });
    return noteId;
  },
});
