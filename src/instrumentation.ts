export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/env");
    const { logger } = await import("./lib/logger");

    validateEnv();

    logger.info("Server started", {
      version: "0.6.3",
      nodeEnv: process.env.NODE_ENV,
    });

    // Graceful shutdown for Cloud Run (sends SIGTERM with 10s grace period)
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      process.exit(0);
    });
  }
}
