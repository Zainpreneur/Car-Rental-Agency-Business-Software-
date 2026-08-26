import { Router } from "express";
import { prisma } from "../prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate, authorize } from "../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/stats",
  authenticate,
  authorize("ADMIN", "STAFF"),
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      totalCustomers,
      activeBookings,
      pendingBookings,
      upcomingReturns,
      monthlyPayments,
      recentBookings,
      vehiclesByCategory,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
      prisma.vehicle.count({ where: { status: "RENTED" } }),
      prisma.vehicle.count({ where: { status: "MAINTENANCE" } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.booking.count({ where: { status: "ACTIVE" } }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.findMany({
        where: { status: "ACTIVE", endDate: { gte: now } },
        orderBy: { endDate: "asc" },
        take: 5,
        include: { vehicle: true, customer: { select: { name: true } } },
      }),
      prisma.payment.findMany({ where: { status: "PAID", paidAt: { gte: startOfMonth } } }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { vehicle: true, customer: { select: { name: true } } },
      }),
      prisma.vehicle.groupBy({ by: ["category"], _count: { _all: true } }),
    ]);

    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    const fleetUtilization = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

    res.json({
      fleet: {
        total: totalVehicles,
        available: availableVehicles,
        rented: rentedVehicles,
        maintenance: maintenanceVehicles,
        utilization: fleetUtilization,
        byCategory: vehiclesByCategory.map((c) => ({ category: c.category, count: c._count._all })),
      },
      bookings: {
        active: activeBookings,
        pending: pendingBookings,
        upcomingReturns,
        recent: recentBookings,
      },
      customers: { total: totalCustomers },
      revenue: { monthly: Number(monthlyRevenue.toFixed(2)) },
    });
  })
);
