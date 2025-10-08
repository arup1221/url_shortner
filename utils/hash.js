import { randomBytes, createHash } from "crypto";

export function hashPasswordWithSalt(password, userSalt= undefined) {
   const salt = userSalt ?? randomBytes(256).toString("hex");
  const hashedPassword = createHash("sha256", salt)
    .update(password)
    .digest("hex");

  return { salt, password: hashedPassword };
}
