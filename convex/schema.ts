import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    clerkId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    role: v.string(),
    approved: v.optional(v.boolean()),
  }).index("by_clerk_id", ["clerkId"]),

  properties: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    prefecture: v.optional(v.string()),
    prefectureId: v.optional(v.string()),
    cityWardTown: v.optional(v.string()),
    area: v.optional(v.string()),
    chome: v.optional(v.string()),
    block: v.optional(v.string()),
    building: v.optional(v.string()),
    room: v.optional(v.string()),
    locationX: v.optional(v.number()),
    locationY: v.optional(v.number()),
    appleMapsUrl: v.optional(v.string()),
    wifiSsid: v.optional(v.string()),
    wifiPassword: v.optional(v.string()),
    guestWifiSsid: v.optional(v.string()),
    guestWifiPassword: v.optional(v.string()),
    mailboxLockCombination: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  groceryItems: defineTable({
    propertyId: v.id("properties"),
    itemName: v.string(),
    quantity: v.optional(v.string()),
    checked: v.boolean(),
    addedBy: v.optional(v.string()),
    completedBy: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  }).index("by_property", ["propertyId"]),

  propertyItems: defineTable({
    propertyId: v.id("properties"),
    title: v.string(),
    boughtDate: v.optional(v.string()),
    category: v.optional(v.string()),
    note: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  }).index("by_property", ["propertyId"]),

  propertyNotes: defineTable({
    propertyId: v.id("properties"),
    content: v.string(),
    createdBy: v.optional(v.string()),
  }).index("by_property", ["propertyId"]),

  propertyMembers: defineTable({
    propertyId: v.id("properties"),
    userId: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("member"),
      v.literal("guest")
    ),
    invitedBy: v.optional(v.string()),
    invitedAt: v.optional(v.number()),
  })
    .index("by_property", ["propertyId"])
    .index("by_user", ["userId"])
    .index("by_property_user", ["propertyId", "userId"]),

});
