import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const maintenanceRouter = Router();

const createSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(["SERVICE", "REPAIR", "INSPECTION", "CLEANING", "TIRE_CHANGE", "OTHER"]).default("SERVICE"),
  description: z.string().min(1),
  cost: z.coerce.number().min(0).default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
});

const updateSchema = createSchema.partial();

maintenanceRouter.get(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  asyncHandler(async (req, res) => {
    const { vehicleId, status } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;
    const records = await prisma.maintenanceRecord.findMany({
      where,
      include: { vehicle: true },
      orderBy: { startDate: "desc" },
    });
    res.json({ maintenance: records });
  })
);

maintenanceRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.body.vehicleId } });
    if (!vehicle) throw ApiError.notFound("Vehicle not found");

    const record = await prisma.maintenanceRecord.create({ data: req.body });

    if (record.status === "SCHEDULED" || record.status === "IN_PROGRESS") {
      await prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: "MAINTENANCE" } });
    }

    res.status(201).json({ maintenance: record });
  })
);

maintenanceRouter.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.maintenanceRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Maintenance record not found");

    const record = await prisma.maintenanceRecord.update({ where: { id: req.params.id }, data: req.body });

    if (record.status === "COMPLETED" || record.status === "CANCELLED") {
      const stillInMaintenance = await prisma.maintenanceRecord.findFirst({
        where: { vehicleId: record.vehicleId, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      });
      if (!stillInMaintenance) {
        await prisma.vehicle.update({ where: { id: record.vehicleId }, data: { status: "AVAILABLE" } });
      }
    } else {
      await prisma.vehicle.update({ where: { id: record.vehicleId }, data: { status: "MAINTENANCE" } });
    }

    res.json({ maintenance: record });
  })
);

maintenanceRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  asyncHandler(async (req, res) => {
    await prisma.maintenanceRecord.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
