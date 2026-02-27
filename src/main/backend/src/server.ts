import dotenv from "dotenv";
import { app } from "./app";
import { logger } from "./utils/logger";

dotenv.config();

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const resolvedPort = Number.isNaN(port) ? 8080 : port;

app.listen(resolvedPort, () => {
  logger.info({ port: resolvedPort }, "Compose to Kubernetes converter server started");
});
