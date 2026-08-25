import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const customersRouter = Router();

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  licenseNumber: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(["ADMIN", "STAFF", "CUSTOMER"]).optional(),
});

function sanitize<T extends { password: string }>(user: T) {
  const { password: _password, ...rest } = user;
  return rest;
}

// GET /api/customers - admin/staff only
customersRouter.get(
  "/",
  authenticate,
  authorize("ADMIN", "STAFF"),
  asyncHandler(async (req, res) => {
    const { search, role } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }
    const users = await prisma.user.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json({ customers: users.map(sanitize) });
  })
);

customersRouter.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user!.role === "CUSTOMER" && req.user!.userId !== req.params.id) {
      throw ApiError.forbidden();
    }
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: { include: { vehicle: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!user) throw ApiError.notFound("Customer not found");
    res.json({ customer: sanitize(user) });
  })
);

customersRouter.put(
  "/:id",
  authenticate,
  validateBody(updateCustomerSchema),
  asyncHandler(async (req, res) => {
    const isSelf = req.user!.userId === req.params.id;
    const isAdmin = req.user!.role === "ADMIN";
    if (!isSelf && !isAdmin) throw ApiError.forbidden();

    const data = { ...req.body };
    // Only admins may change roles or active status
    if (!isAdmin) {
      delete data.role;
      delete data.isActive;
    }

    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({ customer: sanitize(user) });
  })
);
