import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const paymentDB = SQLDatabase.named("store");
