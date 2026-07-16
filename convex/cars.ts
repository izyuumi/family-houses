import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, isUserAdmin, requireAdmin } from "./profiles";
import { isUserApprovedOrAdmin } from "./permissions";
import { getProfileMap } from "./utils";

async function requireApprovedUser(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user || !isUserApprovedOrAdmin(user)) {
    throw new Error("Account must be approved to perform this action");
  }
  return user;
}

function overlaps(
  reservation: Doc<"carReservations">,
  startTime: number,
  endTime: number
) {
  return reservation.startTime < endTime && reservation.endTime > startTime;
}

async function findApprovedConflict(
  ctx: QueryCtx | MutationCtx,
  carId: Id<"cars">,
  startTime: number,
  endTime: number,
  ignoreId?: Id<"carReservations">
) {
  const reservations = await ctx.db
    .query("carReservations")
    .withIndex("by_car", (q) => q.eq("carId", carId))
    .collect();
  return reservations.find(
    (reservation) =>
      reservation._id !== ignoreId &&
      reservation.status === "approved" &&
      overlaps(reservation, startTime, endTime)
  );
}

export const carsWithSchedule = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || !isUserApprovedOrAdmin(user)) return null;

    const [cars, allReservations] = await Promise.all([
      ctx.db.query("cars").order("asc").collect(),
      ctx.db.query("carReservations").collect(),
    ]);
    const now = Date.now();
    const clerkIds = [...new Set(allReservations.map((r) => r.requestedBy))];
    const profileMap = await getProfileMap(ctx, clerkIds);

    const carsWithBookings = await Promise.all(
      cars.map(async (car) => {
        const upcoming = allReservations
          .filter(
            (r) =>
              r.carId === car._id && r.status === "approved" && r.endTime > now
          )
          .sort((a, b) => a.startTime - b.startTime)
          .slice(0, 3)
          .map((r) => ({
            _id: r._id,
            startTime: r.startTime,
            endTime: r.endTime,
            requesterName:
              profileMap.get(r.requestedBy)?.displayName ??
              profileMap.get(r.requestedBy)?.email ??
              null,
            isCurrent: r.startTime <= now,
          }));
        const property = car.propertyId ? await ctx.db.get(car.propertyId) : null;
        return {
          ...car,
          propertyName: property?.name ?? null,
          upcoming,
        };
      })
    );

    return { cars: carsWithBookings, isAdmin: isUserAdmin(user) };
  },
});

export const myReservations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || !isUserApprovedOrAdmin(user)) return [];

    const reservations = await ctx.db
      .query("carReservations")
      .withIndex("by_requester", (q) => q.eq("requestedBy", user.clerkId))
      .order("desc")
      .take(30);
    const cars = new Map(
      (await ctx.db.query("cars").collect()).map((car) => [car._id, car.name])
    );
    return reservations.map((reservation) => ({
      ...reservation,
      carName: cars.get(reservation.carId) ?? "—",
    }));
  },
});

export const pendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!isUserAdmin(user)) return null;

    const pending = await ctx.db
      .query("carReservations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const cars = new Map(
      (await ctx.db.query("cars").collect()).map((car) => [car._id, car.name])
    );
    const profileMap = await getProfileMap(ctx, [
      ...new Set(pending.map((r) => r.requestedBy)),
    ]);
    return pending
      .sort((a, b) => a.startTime - b.startTime)
      .map((reservation) => ({
        ...reservation,
        carName: cars.get(reservation.carId) ?? "—",
        requesterName:
          profileMap.get(reservation.requestedBy)?.displayName ??
          profileMap.get(reservation.requestedBy)?.email ??
          "—",
      }));
  },
});

export const createCar = mutation({
  args: {
    name: v.string(),
    model: v.optional(v.string()),
    plate: v.optional(v.string()),
    propertyId: v.optional(v.id("properties")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!args.name.trim()) throw new Error("A car name is required");
    return await ctx.db.insert("cars", { ...args, name: args.name.trim() });
  },
});

export const updateCar = mutation({
  args: {
    carId: v.id("cars"),
    name: v.optional(v.string()),
    model: v.optional(v.string()),
    plate: v.optional(v.string()),
    propertyId: v.optional(v.id("properties")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { carId, ...updates } = args;
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error("A car name is required");
    }
    await ctx.db.patch(carId, updates);
  },
});

export const deleteCar = mutation({
  args: { carId: v.id("cars") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const reservations = await ctx.db
      .query("carReservations")
      .withIndex("by_car", (q) => q.eq("carId", args.carId))
      .collect();
    await Promise.all(reservations.map((r) => ctx.db.delete(r._id)));
    await ctx.db.delete(args.carId);
  },
});

export const requestReservation = mutation({
  args: {
    carId: v.id("cars"),
    startTime: v.number(),
    endTime: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireApprovedUser(ctx);
    const car = await ctx.db.get(args.carId);
    if (!car) throw new Error("Car not found");
    if (args.endTime <= args.startTime) {
      throw new Error("The end time must be after the start time");
    }
    if (args.endTime <= Date.now()) {
      throw new Error("The reservation must be in the future");
    }

    const conflict = await findApprovedConflict(
      ctx,
      args.carId,
      args.startTime,
      args.endTime
    );
    if (conflict) throw new Error("The car is already booked for that time");

    // Parents (admins) don't need their own permission.
    const isAdmin = isUserAdmin(user);
    return await ctx.db.insert("carReservations", {
      carId: args.carId,
      requestedBy: user.clerkId,
      startTime: args.startTime,
      endTime: args.endTime,
      note: args.note?.trim() || undefined,
      status: isAdmin ? "approved" : "pending",
      ...(isAdmin
        ? { decidedBy: user.clerkId, decidedAt: Date.now() }
        : {}),
    });
  },
});

export const cancelReservation = mutation({
  args: { reservationId: v.id("carReservations") },
  handler: async (ctx, args) => {
    const user = await requireApprovedUser(ctx);
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) throw new Error("Reservation not found");
    if (reservation.requestedBy !== user.clerkId && !isUserAdmin(user)) {
      throw new Error("You can only cancel your own reservations");
    }
    if (reservation.status !== "pending" && reservation.status !== "approved") {
      throw new Error("This reservation can no longer be cancelled");
    }
    await ctx.db.patch(args.reservationId, { status: "cancelled" });
  },
});

export const approveReservation = mutation({
  args: { reservationId: v.id("carReservations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await getCurrentUser(ctx);
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation || reservation.status !== "pending") {
      throw new Error("This request is no longer pending");
    }
    const conflict = await findApprovedConflict(
      ctx,
      reservation.carId,
      reservation.startTime,
      reservation.endTime,
      reservation._id
    );
    if (conflict) throw new Error("The car is already booked for that time");
    await ctx.db.patch(args.reservationId, {
      status: "approved",
      decidedBy: user?.clerkId,
      decidedAt: Date.now(),
    });
  },
});

export const denyReservation = mutation({
  args: {
    reservationId: v.id("carReservations"),
    decisionNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await getCurrentUser(ctx);
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation || reservation.status !== "pending") {
      throw new Error("This request is no longer pending");
    }
    await ctx.db.patch(args.reservationId, {
      status: "denied",
      decidedBy: user?.clerkId,
      decidedAt: Date.now(),
      decisionNote: args.decisionNote?.trim() || undefined,
    });
  },
});
