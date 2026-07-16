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
    autoLockCode: v.optional(v.string()),
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

  switchbotDevices: defineTable({
    propertyId: v.id("properties"),
    accountId: v.optional(v.id("switchbotAccounts")),
    deviceId: v.string(),
    deviceType: v.string(),
    label: v.string(),
    deviceRole: v.union(
      v.literal("entrance"),
      v.literal("unit"),
      v.literal("mailbox"),
      v.literal("other")
    ),
    keypadDeviceId: v.optional(v.string()),
    lockState: v.optional(v.string()),
    doorState: v.optional(v.string()),
    battery: v.optional(v.number()),
    stateUpdatedAt: v.optional(v.number()),
  })
    .index("by_property", ["propertyId"])
    .index("by_device_id", ["deviceId"]),

  lockEvents: defineTable({
    propertyId: v.id("properties"),
    deviceDbId: v.id("switchbotDevices"),
    action: v.string(),
    source: v.string(),
    actorClerkId: v.optional(v.string()),
    lockState: v.optional(v.string()),
    doorState: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_property", ["propertyId"])
    .index("by_device", ["deviceDbId"]),

  integrationSettings: defineTable({
    name: v.string(),
    token: v.optional(v.string()),
    secret: v.optional(v.string()),
    webhookToken: v.optional(v.string()),
  }).index("by_name", ["name"]),

  cars: defineTable({
    name: v.string(),
    model: v.optional(v.string()),
    plate: v.optional(v.string()),
    propertyId: v.optional(v.id("properties")),
    notes: v.optional(v.string()),
  }),

  carReservations: defineTable({
    carId: v.id("cars"),
    requestedBy: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    note: v.optional(v.string()),
    status: v.string(),
    decidedBy: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
    decisionNote: v.optional(v.string()),
  })
    .index("by_car", ["carId"])
    .index("by_requester", ["requestedBy"])
    .index("by_status", ["status"]),

  invitations: defineTable({
    label: v.optional(v.string()),
    email: v.optional(v.string()),
    token: v.string(),
    propertyAssignments: v.array(
      v.object({
        propertyId: v.id("properties"),
        role: v.union(
          v.literal("owner"),
          v.literal("member"),
          v.literal("guest")
        ),
      })
    ),
    status: v.string(),
    invitedBy: v.string(),
    acceptedBy: v.optional(v.string()),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  switchbotAccounts: defineTable({
    label: v.string(),
    token: v.string(),
    secret: v.string(),
  }),

  guestPasscodes: defineTable({
    propertyId: v.id("properties"),
    deviceDbId: v.id("switchbotDevices"),
    name: v.string(),
    code: v.string(),
    passcodeType: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    status: v.string(),
    switchbotKeyId: v.optional(v.string()),
    createdBy: v.string(),
  }).index("by_property", ["propertyId"]),

});
