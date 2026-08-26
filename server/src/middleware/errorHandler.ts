import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  const anyErr = err as { code?: string; message?: string };
  if (anyErr?.code === "P2002") {
    return res.status(409).json({ error: "A record with these unique values already exists" });
  }
  if (anyErr?.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
