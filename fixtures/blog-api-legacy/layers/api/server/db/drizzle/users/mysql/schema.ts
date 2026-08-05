import { mysqlTable, serial, text } from "drizzle-orm/mysql-core";

export const authors = mysqlTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});
