"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { TextField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getMe } from "@/lib/api/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({ resolver: standardSchemaResolver(signInSchema) });

  const supabase = getSupabaseBrowserClient();

  async function onSubmit(values: SignInValues) {
    if (!supabase) {
      toast.error("Accounts are not configured on this deployment.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setSubmitting(false);
      toast.error("Sign in failed", { description: error.message });
      return;
    }
    // Administrators land in their own console; members follow the
    // requested redirect (deep links win) or the member dashboard.
    const redirect = searchParams.get("redirect");
    let target = redirect && redirect.startsWith("/") ? redirect : "/dashboard";
    if (!redirect) {
      const me = await getMe().catch(() => null);
      if (me?.role === "admin") target = "/admin";
    }
    setSubmitting(false);
    router.push(target);
    router.refresh();
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
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" className="w-full" disabled={submitting || !supabase}>
        {submitting ? <Spinner /> : null}
        Sign in
      </Button>
    </form>
  );
}
