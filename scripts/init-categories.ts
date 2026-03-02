import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AgentCategoryTable } from "lib/db/pg/schema.pg";

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
const db = drizzle(pool);

async function init() {
  console.log("Initializing default agent categories...");

  await db.insert(AgentCategoryTable).values([
    { name: "营销", emoji: "📢", sortOrder: 1 },
    { name: "法务", emoji: "⚖️", sortOrder: 2 },
    { name: "产品", emoji: "📦", sortOrder: 3 },
    { name: "规划", emoji: "🎯", sortOrder: 4 },
    { name: "人事", emoji: "👥", sortOrder: 5 },
  ]).onConflictDoNothing();

  console.log("✅ Categories initialized successfully!");
  await pool.end();
  process.exit(0);
}

init().catch((error) => {
  console.error("❌ Error initializing categories:", error);
  process.exit(1);
});
