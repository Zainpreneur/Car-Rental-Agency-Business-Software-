import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const paymentsRouter = Router();

const createPaymentSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "ONLINE"]).default("CARD"),
  transactionRef: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "REFUNDED", "FAILED"]).default("PAID"),
});

const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "REFUNDED", "FAILED"]),
});

paymentsRouter.get(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  asyncHandler(async (req, res) => {
    const { status } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const payments = await prisma.payment.findMany({
      where,
      include: { booking: { include: { vehicle: true, customer: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ payments });
  })
);

paymentsRouter.get(
  "/booking/:bookingId",
  authenticate,
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) throw ApiError.notFound("Booking not found");
    if (req.user!.role === "CUSTOMER" && booking.customerId !== req.user!.userId) {
      throw ApiError.forbidden();
    }
    const payments = await prisma.payment.findMany({
      where: { bookingId: req.params.bookingId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ payments });
  })
);

paymentsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  validateBody(createPaymentSchema),
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({ where: { id: req.body.bookingId } });
    if (!booking) throw ApiError.notFound("Booking not found");

    const payment = await prisma.payment.create({
      data: { ...req.body, paidAt: req.body.status === "PAID" ? new Date() : null },
    });
    res.status(201).json({ payment });
  })
);

paymentsRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "STAFF"),
  validateBody(updatePaymentSchema),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status, paidAt: status === "PAID" ? new Date() : undefined },
    });
    res.json({ payment });
  })
);
