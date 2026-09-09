import { cors } from "hono/cors";
import type { Context, Next } from "hono";
import type { Env } from "@shared/types/index";
import { errorResponse } from "@shared/utils/response";

export const corsMiddleware = cors({
  origin: (origin, c) => {
    const allowed =
      c.env.ALLOWED_ORIGINS?.split(",").map((o: string) => o.trim()) ?? [];
    if (allowed.length === 0) return origin || "*";
    if (!origin) return allowed[0];
    return allowed.includes(origin) ? origin : allowed[0];
  },
  allowHeaders: ["Content-Type"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

export const errorHandler = async (c: Context<{ Bindings: Env }>, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return c.json(errorResponse(message, "INTERNAL_SERVER_ERROR"), 500);
  }
};
