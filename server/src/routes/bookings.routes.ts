import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const bookingsRouter = Router();

const createBookingSchema = z
  .object({
    vehicleId: z.string().min(1),
    customerId: z.string().optional(), // staff/admin may book on behalf of a customer
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    pickupLocation: z.string().min(1),
    dropoffLocation: z.string().min(1),
    notes: z.string().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]),
});

function generateBookingNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BK-${stamp}-${rand}`;
}

function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// GET /api/bookings - admin/staff see all, customers see their own
bookingsRouter.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { status } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (req.user!.role === "CUSTOMER") {
      where.customerId = req.user!.userId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        vehicle: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ bookings });
  })
);

bookingsRouter.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        payments: true,
      },
    });
    if (!booking) throw ApiError.notFound("Booking not found");
    if (req.user!.role === "CUSTOMER" && booking.customerId !== req.user!.userId) {
      throw ApiError.forbidden();
    }
    res.json({ booking });
  })
);

bookingsRouter.post(
  "/",
  authenticate,
  validateBody(createBookingSchema),
  asyncHandler(async (req, res) => {
    const { vehicleId, startDate, endDate, pickupLocation, dropoffLocation, notes } = req.body;
    const customerId =
      req.user!.role === "CUSTOMER" ? req.user!.userId : req.body.customerId ?? req.user!.userId;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw ApiError.notFound("Vehicle not found");
    if (vehicle.status === "RETIRED" || vehicle.status === "MAINTENANCE") {
      throw ApiError.conflict(`Vehicle is currently ${vehicle.status.toLowerCase()} and cannot be booked`);
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
    if (conflict) {
      throw ApiError.conflict("This vehicle is already booked for the selected dates");
    }

    const days = daysBetween(new Date(startDate), new Date(endDate));
    const totalAmount = Number((days * vehicle.dailyRate).toFixed(2));

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        customerId,
        vehicleId,
        startDate,
        endDate,
        pickupLocation,
        dropoffLocation,
        notes,
        dailyRate: vehicle.dailyRate,
        totalAmount,
        status: "PENDING",
      },
      include: { vehicle: true, customer: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ booking });
  })
);

bookingsRouter.patch(
  "/:id/status",
  authenticate,
  validateBody(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw ApiError.notFound("Booking not found");

    const isOwner = booking.customerId === req.user!.userId;
    const isStaff = req.user!.role === "ADMIN" || req.user!.role === "STAFF";
    if (!isOwner && !isStaff) throw ApiError.forbidden();

    // Customers may only cancel their own pending/confirmed bookings
    if (!isStaff && status !== "CANCELLED") {
      throw ApiError.forbidden("Customers may only cancel bookings");
    }
    if (!isStaff && !["PENDING", "CONFIRMED"].includes(booking.status)) {
      throw ApiError.conflict("This booking can no longer be cancelled");
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["ACTIVE", "CANCELLED"],
      ACTIVE: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (!validTransitions[booking.status].includes(status)) {
      throw ApiError.conflict(`Cannot transition booking from ${booking.status} to ${status}`);
    }

    const data: Record<string, unknown> = { status };
    if (status === "ACTIVE") data.actualPickupAt = new Date();
    if (status === "COMPLETED") data.actualReturnAt = new Date();

    const updated = await prisma.booking.update({ where: { id: req.params.id }, data });

    // Keep vehicle status in sync with the fleet
    if (status === "ACTIVE") {
      await prisma.vehicle.update({ where: { id: booking.vehicleId }, data: { status: "RENTED" } });
    } else if (status === "COMPLETED" || status === "CANCELLED") {
      const stillRented = await prisma.booking.findFirst({
        where: { vehicleId: booking.vehicleId, status: "ACTIVE" },
      });
      if (!stillRented) {
        await prisma.vehicle.update({ where: { id: booking.vehicleId }, data: { status: "AVAILABLE" } });
      }
    }

    res.json({ booking: updated });
  })
);

bookingsRouter.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  asyncHandler(async (req, res) => {
    const { pickupLocation, dropoffLocation, notes, startDate, endDate } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw ApiError.notFound("Booking not found");

    const data: Record<string, unknown> = { pickupLocation, dropoffLocation, notes };
    if (startDate && endDate) {
      const days = daysBetween(new Date(startDate), new Date(endDate));
      data.startDate = new Date(startDate);
      data.endDate = new Date(endDate);
      data.totalAmount = Number((days * booking.dailyRate).toFixed(2));
    }

    const updated = await prisma.booking.update({ where: { id: req.params.id }, data });
    res.json({ booking: updated });
  })
);
