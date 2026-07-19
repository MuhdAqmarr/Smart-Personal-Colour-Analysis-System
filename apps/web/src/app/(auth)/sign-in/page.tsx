import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthFormShell
      title="Welcome back"
      description="Sign in to see your saved analyses and favourites."
      footer={
        <p className="text-muted-foreground">
          New here?{" "}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthFormShell>
  );
}
