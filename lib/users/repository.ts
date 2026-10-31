import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/infra/postgres";
import { users } from "./tables";
import type { NewUser, User } from "./types";

export async function findUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}

export async function findUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  return db.select().from(users).where(inArray(users.id, ids));
}

export async function insertUser(user: NewUser): Promise<Pick<User, "id" | "email">> {
  const [created] = await db
    .insert(users)
    .values(user)
    .returning({ id: users.id, email: users.email });
  return created;
}
