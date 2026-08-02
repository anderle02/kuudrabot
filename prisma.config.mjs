import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "apps/worker/prisma/schema.prisma",
  migrations: {
    path: "apps/worker/prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
