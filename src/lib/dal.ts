import { redirect } from "next/navigation";
import { verifySession } from "./auth";

export async function requireAuth() {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    redirect("/login");
  }
}
