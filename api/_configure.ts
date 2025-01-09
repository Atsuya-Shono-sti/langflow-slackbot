import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@prisma/client";
import { logger } from "./_logger";

neonConfig.webSocketConstructor = ws;
const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
export const prisma = new PrismaClient({ adapter });

export async function Configure(
  userId: string = "",
  endpoint?: string,
  token?: string,
  langflowId?: string,
  flowId?: string
) {
  const upsertConfig = await prisma.config.upsert({
    where: {
      userid: userId,
    },
    update: {
      ...(endpoint && { endpoint: endpoint }),
      ...(token && { token: token }),
      ...(flowId && { flowId: flowId }),
      ...(langflowId && { langflowId: langflowId }),
    },
    create: {
      userid: userId,
      endpoint: endpoint,
      token: token,
      flowId: flowId,
      langflowId: langflowId,
    },
  });
  logger.info("Update config" + upsertConfig);
}

export async function getConfig(userId: string) {
  if (!userId) {
    throw new Error("User ID is required to fetch configuration.");
  }

  const config = await prisma.config.findUnique({
    where: {
      userid: userId,
    },
  });
  return config;
}
