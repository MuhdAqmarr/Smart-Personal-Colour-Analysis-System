"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { TextField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z
  .object({
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .regex(/[a-z]/, "Include a lowercase letter.")
      .regex(/[A-Z0-9]/, "Include an uppercase letter or number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
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
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSubmitting(false);
    if (error) {
      toast.error("Could not update password", {
        description:
          error.message === "Auth session missing!"
            ? "Open the reset link from your email again — the session may have expired."
            : error.message,
      });
      return;
    }
    toast.success("Password updated");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 10 characters with mixed case or numbers."
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" className="w-full" disabled={submitting || !supabase}>
        {submitting ? <Spinner /> : null}
        Update password
      </Button>
    </form>
  );
}
