import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const vehiclesRouter = Router();

const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  category: z.enum(["ECONOMY", "COMPACT", "SEDAN", "SUV", "LUXURY", "VAN", "TRUCK", "CONVERTIBLE"]),
  licensePlate: z.string().min(1),
  color: z.string().optional(),
  seats: z.coerce.number().int().min(1).max(20).default(5),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]).default("AUTOMATIC"),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC"]).default("PETROL"),
  dailyRate: z.coerce.number().positive(),
  mileage: z.coerce.number().int().min(0).default(0),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE", "RETIRED"]).optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  features: z.string().optional(),
});

const updateVehicleSchema = vehicleSchema.partial();

// GET /api/vehicles - list with filters, public-ish (requires auth)
vehiclesRouter.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { status, category, search, startDate, endDate } = req.query as Record<string, string | undefined>;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { make: { contains: search } },
        { model: { contains: search } },
        { licensePlate: { contains: search } },
      ];
    }

    let vehicles = await prisma.vehicle.findMany({ where, orderBy: { createdAt: "desc" } });

    // Filter by availability across a date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const overlapping = await prisma.booking.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          startDate: { lt: end },
          endDate: { gt: start },
        },
        select: { vehicleId: true },
      });
      const bookedIds = new Set(overlapping.map((b) => b.vehicleId));
      vehicles = vehicles.filter((v) => !bookedIds.has(v.id) && v.status !== "RETIRED" && v.status !== "MAINTENANCE");
    }

    res.json({ vehicles });
  })
);

vehiclesRouter.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { maintenance: { orderBy: { startDate: "desc" } } },
    });
    if (!vehicle) throw ApiError.notFound("Vehicle not found");
    res.json({ vehicle });
  })
);

vehiclesRouter.get(
  "/:id/availability",
  authenticate,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query as Record<string, string | undefined>;
    if (!startDate || !endDate) {
      throw ApiError.badRequest("startDate and endDate query params are required");
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    const conflict = await prisma.booking.findFirst({
      where: {
        vehicleId: req.params.id,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });

    res.json({ available: !conflict });
  })
);

vehiclesRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  validateBody(vehicleSchema),
  asyncHandler(async (req, res) => {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json({ vehicle });
  })
);

vehiclesRouter.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  validateBody(updateVehicleSchema),
  asyncHandler(async (req, res) => {
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
    res.json({ vehicle });
  })
);

vehiclesRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const activeBooking = await prisma.booking.findFirst({
      where: { vehicleId: req.params.id, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] } },
    });
    if (activeBooking) {
      throw ApiError.conflict("Cannot delete a vehicle with active or upcoming bookings");
    }
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
