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

const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "Display name needs at least 2 characters.")
      .max(60, "Display name is too long."),
    email: z.email("Enter a valid email address."),
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

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: standardSchemaResolver(registerSchema) });

  const supabase = getSupabaseBrowserClient();

  async function onSubmit(values: RegisterValues) {
    if (!supabase) {
      toast.error("Accounts are not configured on this deployment.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { display_name: values.displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error("Registration failed", { description: error.message });
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <div className="space-y-3 text-center" role="status">
        <p className="font-medium">Check your inbox</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We sent a verification link to your email address. Open it to activate your account, then
          sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <TextField
        label="Display name"
        autoComplete="name"
        placeholder="How should we greet you?"
        error={errors.displayName?.message}
        {...register("displayName")}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 10 characters with mixed case or numbers."
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" className="w-full" disabled={submitting || !supabase}>
        {submitting ? <Spinner /> : null}
        Create account
      </Button>
      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        By creating an account you agree to the terms of use and privacy policy.
      </p>
    </form>
  );
}
