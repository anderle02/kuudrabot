import { startHealthServer } from "./health.js";
import { logger } from "./logger.js";

startHealthServer();
setInterval(() => logger.info("hi!"), 1000);
