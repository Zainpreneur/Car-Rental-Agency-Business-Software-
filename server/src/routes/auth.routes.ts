import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { signToken } from "../utils/jwt";
import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  licenseNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

function sanitizeUser<T extends { password: string }>(user: T) {
  const { password: _password, ...rest } = user;
  return rest;
}

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, phone, address, licenseNumber } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone, address, licenseNumber, role: "CUSTOMER" },
    });

    const token = signToken({ userId: user.id, role: user.role as "ADMIN" | "STAFF" | "CUSTOMER" });
    res.status(201).json({ token, user: sanitizeUser(user) });
  })
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const token = signToken({ userId: user.id, role: user.role as "ADMIN" | "STAFF" | "CUSTOMER" });
    res.json({ token, user: sanitizeUser(user) });
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      throw ApiError.notFound("User not found");
    }
    res.json({ user: sanitizeUser(user) });
  })
);
