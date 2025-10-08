import { db } from "../db/index.js";
import { usersTable } from "../models/user.model.js";

export async function createUser(payload) {
  const { email, firstname, lastname, salt, password } = payload;

  const [user] = await db
    .insert(usersTable)
    .values({ email, firstname, lastname, salt, password })
    .returning({ id: usersTable.id });

  return user; 
}
