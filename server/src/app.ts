import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { vehiclesRouter } from "./routes/vehicles.routes";
import { bookingsRouter } from "./routes/bookings.routes";
import { customersRouter } from "./routes/customers.routes";
import { paymentsRouter } from "./routes/payments.routes";
import { maintenanceRouter } from "./routes/maintenance.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "car-rental-api", time: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);
