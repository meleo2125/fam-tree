"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidPassword, expectedSessionValue } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!(await isValidPassword(password))) {
    redirect("/login?error=1");
  }
  const value = await expectedSessionValue();
  const cookieStore = await cookies();
  cookieStore.set("family_tree_session", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("family_tree_session");
  redirect("/login");
}
