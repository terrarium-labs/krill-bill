import { Hono } from "hono";
import { logger } from "hono/logger";
import { corsMiddleware, errorHandler } from "@api-server/middleware";
import { healthRouter } from "@api-server/routes/health";
import { contactsRouter } from "@api-server/routes/contacts";
import type { Env } from "@shared/types/index";
import { errorResponse } from "@shared/utils/response";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", corsMiddleware);
app.use("*", errorHandler);

app.route("/health", healthRouter);
app.route("/api", contactsRouter);

app.notFound((c) => c.json(errorResponse("Not Found", "NOT_FOUND"), 404));

export default app;
