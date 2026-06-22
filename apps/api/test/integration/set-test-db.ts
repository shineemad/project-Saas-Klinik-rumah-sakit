// Jest setupFile for integration tests.
// Redirects Prisma to the dedicated TEST database so integration tests
// NEVER touch the production (Neon) database. The actual TEST_DATABASE_URL
// value is loaded from the root .env by dotenv-cli (see "test:integration").
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DIRECT_URL = process.env.TEST_DATABASE_URL;
}
