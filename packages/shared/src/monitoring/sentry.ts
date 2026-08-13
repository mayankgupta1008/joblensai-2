import * as Sentry from "@sentry/node";
import type { Express } from "express";

/**
 * Centralized initialization helper for Sentry / GlitchTip error tracking.
 * Call this in your Express microservice entrypoints (e.g. index.ts).
 */
export const initSentry = (serviceName: string) => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn(`[Sentry] SENTRY_DSN not defined for ${serviceName}. Error tracking disabled.`);
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    serverName: serviceName,
    tracesSampleRate: 1.0,
  });

  console.log(`[Sentry] Successfully initialized error tracking for '${serviceName}'`);
};

/**
 * Captures errors thrown inside Express routes/middleware.
 * Must be registered AFTER all routes are mounted.
 */
export const setupSentryErrorHandler = (app: Express) => {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setupExpressErrorHandler(app);
};
