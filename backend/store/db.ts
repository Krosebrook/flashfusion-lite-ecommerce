import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const storeDB = new SQLDatabase("store", {
  migrations: "./migrations",
});
