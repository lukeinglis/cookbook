"use server";

import { checkPassword, createSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;

  if (!password) {
    return { error: "Password is required" };
  }

  const valid = await checkPassword(password);
  if (!valid) {
    logger.warn({ event: "login_failed" }, "Failed login attempt");
    return { error: "Invalid password" };
  }

  logger.info({ event: "login_success" }, "Successful login");
  await createSession();
  return { success: true };
}
