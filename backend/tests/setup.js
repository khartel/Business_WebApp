const prisma = require("../src/utils/prisma");

if (process.env.NODE_ENV !== "test" || !process.env.DATABASE_URL?.includes("_test")) {
  throw new Error(
    "Refusing to run tests: NODE_ENV must be 'test' and DATABASE_URL must point at a *_test database. " +
      "Run tests via `npm test` (which loads .env.test), not directly against dev data."
  );
}

// Tables in FK-safe order (children before parents) for TRUNCATE ... CASCADE between tests.
const TABLES = [
  "TransactionItem",
  "Transaction",
  "StockMovement",
  "WarehouseStock",
  "Product",
  "Warehouse",
  "BusinessUser",
  "Business",
  "User",
];

afterEach(async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
