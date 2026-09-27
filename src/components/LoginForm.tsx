"use client";

import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { Lock, AlertCircle } from "lucide-react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "1";

  return (
    <form action={loginAction} className="w-full max-w-sm space-y-4">
      {hasError && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-card">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Incorrect password. Please try again.</span>
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium font-body text-textSecondary mb-1.5"
        >
          Family Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            placeholder="Enter password..."
            className="w-full pl-10 pr-4 py-2.5 rounded-card border border-border bg-surface text-textPrimary placeholder:text-textSecondary/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 px-4 rounded-card bg-primary hover:bg-primary/90 text-white font-medium font-body text-sm shadow-sm transition-colors cursor-pointer"
      >
        Sign In
      </button>
    </form>
  );
}
