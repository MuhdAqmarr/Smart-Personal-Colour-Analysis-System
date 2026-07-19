"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { TextField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({ email: z.email("Enter a valid email address.") });
type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: standardSchemaResolver(schema) });

  const supabase = getSupabaseBrowserClient();

  async function onSubmit(values: Values) {
    if (!supabase) {
      toast.error("Accounts are not configured on this deployment.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send reset email", { description: error.message });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center" role="status">
        <p className="font-medium">Reset link sent</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          If an account exists for that address, an email with a password-reset link is on its way.
          The link opens a page where you can choose a new password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" className="w-full" disabled={submitting || !supabase}>
        {submitting ? <Spinner /> : null}
        Send reset link
      </Button>
    </form>
  );
}
