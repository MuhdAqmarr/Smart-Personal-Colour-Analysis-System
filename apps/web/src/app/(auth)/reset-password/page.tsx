import type { Metadata } from "next";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthFormShell
      title="Choose a new password"
      description="You arrived here from a password-reset email. Set your new password below."
    >
      <ResetPasswordForm />
    </AuthFormShell>
  );
}
