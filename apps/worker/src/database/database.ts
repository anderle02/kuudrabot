import { env } from "@kuudrabot/shared";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/** Use this for any interactions with the Postgres database.
 * @link Documentation: https://www.prisma.io/docs/orm/reference/prisma-client-reference
 */
const database = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.DATABASE_URL,
  }),
});
