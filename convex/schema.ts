import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  accounts: defineTable({
    sourceId: v.string(),
    name: v.string(),
    slug: v.string(),
    categoryId: v.optional(v.string()),
    area: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    plan: v.optional(v.string()),
    featured: v.boolean(),
    sourceCreatedAt: v.optional(v.string()),
    sourceUpdatedAt: v.string(),
  }).index("by_source_id", ["sourceId"]),

  contacts: defineTable({
    sourceId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    consentContact: v.boolean(),
    consentVersion: v.optional(v.string()),
    consentedAt: v.optional(v.string()),
    area: v.optional(v.string()),
    sourceUpdatedAt: v.string(),
  }).index("by_source_id", ["sourceId"]),

  opportunities: defineTable({
    sourceId: v.string(),
    contactSourceId: v.string(),
    title: v.string(),
    stage: v.string(),
    category: v.optional(v.string()),
    verticalId: v.optional(v.string()),
    area: v.optional(v.string()),
    budget: v.optional(v.string()),
    eventDate: v.optional(v.string()),
    sourcePath: v.optional(v.string()),
    consentContact: v.boolean(),
    sourceCreatedAt: v.optional(v.string()),
    routedAt: v.optional(v.string()),
    anonymizedAt: v.optional(v.string()),
    sourceUpdatedAt: v.string(),
  })
    .index("by_source_id", ["sourceId"])
    .index("by_stage", ["stage"]),

  assignments: defineTable({
    sourceId: v.string(),
    opportunitySourceId: v.string(),
    accountSourceId: v.string(),
    status: v.string(),
    mode: v.optional(v.string()),
    delivery: v.optional(v.string()),
    sentAt: v.optional(v.string()),
    viewedAt: v.optional(v.string()),
    acceptedAt: v.optional(v.string()),
    outcomeAt: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    deliveredAt: v.optional(v.string()),
    sourceUpdatedAt: v.string(),
  })
    .index("by_source_id", ["sourceId"])
    .index("by_opportunity", ["opportunitySourceId"])
    .index("by_account", ["accountSourceId"]),

  tasks: defineTable({
    title: v.string(),
    status: v.string(),
    priority: v.string(),
    dueAt: v.optional(v.number()),
    opportunitySourceId: v.optional(v.string()),
    accountSourceId: v.optional(v.string()),
    assigneeUserId: v.optional(v.string()),
    createdByUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_assignee", ["assigneeUserId", "status"]),

  notes: defineTable({
    body: v.string(),
    opportunitySourceId: v.optional(v.string()),
    accountSourceId: v.optional(v.string()),
    authorUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_opportunity", ["opportunitySourceId"])
    .index("by_account", ["accountSourceId"]),

  activities: defineTable({
    sourceEventId: v.optional(v.string()),
    kind: v.string(),
    summary: v.string(),
    aggregateType: v.string(),
    aggregateSourceId: v.string(),
    actorUserId: v.optional(v.string()),
    occurredAt: v.string(),
  })
    .index("by_source_event", ["sourceEventId"])
    .index("by_aggregate", ["aggregateType", "aggregateSourceId"]),

  syncEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    aggregateType: v.string(),
    aggregateId: v.string(),
    occurredAt: v.string(),
    receivedAt: v.number(),
    status: v.string(),
  }).index("by_event_id", ["eventId"]),

  sourceVersions: defineTable({
    aggregateType: v.string(),
    aggregateId: v.string(),
    occurredAt: v.string(),
    eventId: v.string(),
  }).index("by_aggregate", ["aggregateType", "aggregateId"]),
});
