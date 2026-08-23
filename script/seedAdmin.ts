import "dotenv/config";
import bcrypt from "bcryptjs";
import { authStorage } from "../server/replit_integrations/auth/storage";

async function main() {
  const email = "claire@gmail.com";
  const plain = "claire123";
  const firstName = "Claire";
  const name = "claire";

  const hash = bcrypt.hashSync(plain, 12);

  const user = await authStorage.upsertUser({
    email,
    name,
    firstName,
    passwordHash: hash,
    isAdmin: true,
  } as any);

  console.log("Inserted admin user:", { id: user.id, email: user.email, isAdmin: user.isAdmin });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
