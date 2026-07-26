import path from "node:path";
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

// Load .env from the current directory
dotenv.config({ quiet: true });

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  
  // This explicitly passes the URL to the CLI for migrations
  datasource: {
    url: process.env.DATABASE_URL,
  },

  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { default: pg } = await import("pg");
      
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL is not defined in your .env file");
      }

      const pool = new pg.Pool({ connectionString });
      return new PrismaPg(pool);
    },
  },
});