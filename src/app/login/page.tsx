import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Users } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-sm flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-textPrimary tracking-tight">
          Family Tree
        </h1>
        <p className="text-sm font-body text-textSecondary mt-1 text-center">
          Enter the family password to access the tree
        </p>
      </div>

      <div className="w-full max-w-sm bg-surface p-6 rounded-card border border-border shadow-sm">
        <Suspense fallback={<div className="text-center py-4 font-body text-sm text-textSecondary">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
