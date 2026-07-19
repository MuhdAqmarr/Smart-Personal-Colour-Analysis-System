import type { Metadata } from "next";
import Link from "next/link";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthFormShell
      title="Reset your password"
      description="Enter your email and we will send you a reset link."
      footer={
        <p className="text-muted-foreground">
          Remembered it?{" "}
          <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthFormShell>
  );
}
